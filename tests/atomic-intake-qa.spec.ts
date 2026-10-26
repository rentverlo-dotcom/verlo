import { test, expect } from "@playwright/test"

// Must run only on the branch-scoped Preview with atomic intake enabled.
// The server suppresses notification side effects for @example.com in this branch.
test("atomic QA owner intake persists lead without external effects", async ({request}) => {
  const base = process.env.PLAYWRIGHT_BASE_URL || ""
  test.skip(!base.includes("vercel.app"), "Only the controlled Preview may be tested")
  const email = `atomic-qa-${Date.now()}@example.com`
  const response = await request.post("/api/lead-intake", { data: {
    full_name:"Atomic QA Owner",email,phone:"1155555555",
    role:"owner",intent:"owner_new_listing",zone:"Olivos",
    neighborhood_labels:["Olivos"],
    neighborhood_slugs:["ar:06:060756:06075610"],
    neighborhood_slug:"ar:06:060756:06075610",
    property_type:"Departamento",property_rooms:"2 ambientes",
    approx_price:"700001-900000",availability_status:"En 1 a 3 meses",
    accepted_income_proof_types:["salary_receipt"],
    min_income_ratio:2, accepted_guarantee_types:["surety_insurance"],
    source:"qa_atomic_preview",
    metadata:{georef:[{
      provinceId:"06",provinceName:"Buenos Aires",
      municipalityId:"060756",municipalityName:"Vicente López",
      localityId:"06075610",localityName:"Olivos",
      key:"ar:06:060756:06075610",label:"Olivos, Vicente López, Buenos Aires",latitude:-34.51,longitude:-58.49
    }]}
  }})
  const body = await response.json()
  expect(response.status(),JSON.stringify(body)).toBe(200)
  expect(body.ok).toBe(true)
  expect(body.lead_id).toMatch(/^[a-f0-9-]{36}$/i)
  expect(body.match_result?.created || 0).toBe(0)
  expect(body.push_events?.intake).toBeNull()
  expect(body.push_events?.matches || []).toEqual([])
  expect(body.meta?.skipped).toBe(true)
  expect(body.qa_persisted_georef).toEqual([expect.objectContaining({
    province_id:"06", municipality_id:"060756",
    locality_id:"06075610", geo_key:"ar:06:060756:06075610",
  })])
  console.log("QA_ATOMIC_LEAD_ID",body.lead_id)
  console.log("QA_ATOMIC_EMAIL",email)
})


test("atomic QA tenant persists canonical locations without notifications", async ({request}) => {
  const base = process.env.PLAYWRIGHT_BASE_URL || ""
  test.skip(!base.includes("vercel.app"), "Only controlled Preview")
  const email = `atomic-tenant-${Date.now()}@example.com`
  const response = await request.post("/api/lead-intake", {data:{
    full_name:"Atomic QA Tenant", email, phone:"1155555555",
    role:"tenant", intent:"tenant_search", zone:"Olivos",
    neighborhood_labels:["Olivos"],
    neighborhood_slugs:["ar:06:060756:06075610"],
    neighborhood_slug:"ar:06:060756:06075610",
    desired_property_type:"Departamento",desired_rooms:"2 ambientes",
    budget_range:"700001-900000",move_timing:"En 1 a 3 meses",
    income_proof_type:"salary_receipt",income_range:"2000001-3000000",
    guarantee_types:["surety_insurance"],source:"qa_atomic_preview",
    metadata:{georef:[{
      provinceId:"06",provinceName:"Buenos Aires",
      municipalityId:"060756",municipalityName:"Vicente López",
      localityId:"06075610",localityName:"Olivos",
      key:"ar:06:060756:06075610",label:"Olivos, Vicente López, Buenos Aires",
      latitude:-34.51,longitude:-58.49
    }]}
  }})
  const body=await response.json()
  expect(response.status(),JSON.stringify(body)).toBe(200)
  expect(body.lead_id).toMatch(/^[a-f0-9-]{36}$/i)
  expect(body.qa_persisted_georef).toEqual([expect.objectContaining({
    province_id:"06",municipality_id:"060756",locality_id:"06075610",
    geo_key:"ar:06:060756:06075610",
  })])
  expect(body.match_result?.created || 0).toBe(0)
  expect(body.push_events?.intake).toBeNull()
  expect(body.push_events?.matches || []).toEqual([])
  expect(body.meta?.skipped).toBe(true)
  console.log("QA_ATOMIC_TENANT_LEAD_ID",body.lead_id)
  console.log("QA_ATOMIC_TENANT_EMAIL",email)
})

test("atomic QA rejects incomplete georef before writing", async ({request}) => {
  const response=await request.post("/api/lead-intake",{data:{
    full_name:"Atomic QA Invalid",email:`atomic-invalid-${Date.now()}@example.com`,
    phone:"1155555555",role:"owner",intent:"owner_new_listing",
    zone:"Olivos",neighborhood_labels:["Olivos"],neighborhood_slugs:["olivos"],
    neighborhood_slug:"olivos",property_type:"Departamento",
    source:"qa_atomic_preview",metadata:{georef:[]}
  }})
  const body=await response.json()
  expect(response.status(),JSON.stringify(body)).toBe(400)
  expect(body.ok).toBe(false)
  expect(body.lead_id).toBeUndefined()
})
