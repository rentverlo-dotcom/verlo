import { test, expect } from "@playwright/test"

/**
 * Non-destructive PowerMarket checks. No authentication fixtures, no writes,
 * no payment calls, no delivery endpoint invocation and no historical users.
 * Screenshots are written to test-results/ for review.
 */
const origin = process.env.POWERMARKET_QA_ORIGIN || "https://verlo.lat"
const paths = ["/", "/caucion/solicitar", "/powermarket", "/mi-verlo"]
for (const viewport of [
 {name:"desktop",width:1440,height:900},
 {name:"mobile",width:390,height:844}
]) {
 for (const path of paths) {
  test(`${viewport.name} ${path} renders without server error`, async ({browser}) => {
   const context = await browser.newContext({viewport:{width:viewport.width,height:viewport.height}})
   const page = await context.newPage()
   const errors:string[]=[]
   page.on("pageerror",e=>errors.push(e.message))
   // Prevent any accidental writes from client-side effects in this read-only suite.
   await page.route("**/*", async route => {
    const request=route.request()
    if (!["GET","HEAD","OPTIONS"].includes(request.method())) {
     await route.fulfill({status:403,body:"Read-only QA"})
     return
    }
    await route.continue()
   })
   const res=await page.goto(origin+path,{waitUntil:"domcontentloaded",timeout:30000})
   expect(res?.status()).toBeLessThan(500)
   await page.screenshot({path:`test-results/powermarket-${viewport.name}-${path.replace(/[^a-z0-9]+/gi,"-")||"home"}.png`,fullPage:true})
   if(path==="/caucion/solicitar"){
    await expect(page.getByRole("link",{name:"Verlo",exact:true})).toBeVisible()
    await expect(page.getByRole("link",{name:"Mi VERLO",exact:true})).toBeVisible()
    await expect(page.getByRole("heading",{name:/Precalificá tu seguro de caución/i})).toBeVisible()
   }
   if(path==="/powermarket"){
    await expect(page.getByRole("link",{name:"Verlo",exact:true})).toBeVisible()
   }
   expect(errors).toEqual([])
   await context.close()
  })
 }
}
test("private owner status rejects unauthenticated access",async({request})=>{
 const r=await request.get(origin+"/api/powermarket/owner-status")
 expect(r.status()).toBe(401)
})
test("push dispatcher rejects unauthenticated access without sending",async({request})=>{
 const r=await request.post(origin+"/api/cron/powermarket-push")
 expect(r.status()).toBe(401)
})
