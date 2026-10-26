import {NextRequest,NextResponse} from "next/server"
import {createClient} from "@supabase/supabase-js"
import webpush from "web-push"
export const runtime="nodejs"
export const dynamic="force-dynamic"
const reply=(status:number,data:object)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}})
export async function GET(request:NextRequest){return handle(request,false)}
export async function POST(request:NextRequest){return handle(request,true)}
async function handle(request:NextRequest,send:boolean){
  if(process.env.VERCEL_ENV!=="production" || process.env.TEMPORARY_PUBLIC_ENABLED!=="true")return reply(404,{ok:false})
  const secret=process.env.TEMPORARY_NOTIFICATIONS_CRON_SECRET
  if(!secret || request.headers.get("authorization")!==`Bearer ${secret}`)return reply(401,{ok:false})
  const dbUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,dbKey=process.env.SUPABASE_SERVICE_ROLE_KEY
  if(!dbUrl||!dbKey)return reply(503,{ok:false,error:"Database unavailable"})
  const db=createClient(dbUrl,dbKey,{auth:{persistSession:false,autoRefreshToken:false}})
  if(!send || process.env.TEMPORARY_NOTIFICATION_DELIVERY_ENABLED!=="true" || process.env.TEMPORARY_DB_WRITES_ENABLED!=="true"){
    const {data,error}=await db.from("temporary_push_outbox").select("id,event_type,status,attempts").in("status",["pending","failed"]).lte("available_at",new Date().toISOString()).order("created_at",{ascending:true}).limit(20)
    if(error)return reply(503,{ok:false,error:"Push queue unavailable"})
    return reply(200,{ok:true,mode:"dry_run",count:data?.length||0,events:data||[]})
  }
  const publicKey=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,privateKey=process.env.VAPID_PRIVATE_KEY,subject=process.env.VAPID_SUBJECT
  if(!publicKey||!privateKey||!subject)return reply(503,{ok:false,error:"VAPID configuration missing"})
  webpush.setVapidDetails(subject,publicKey,privateKey)
  const {data:events,error:claimError}=await db.rpc("temporary_claim_push",{p_limit:10})
  if(claimError)return reply(503,{ok:false,error:"Push claim unavailable"})
  let accepted=0,failed=0,noSubscription=0
  for(const event of events||[]){
    let status:"sent"|"failed"|"no_subscription"="failed",reason=""
    try{
      const {data:subs,error:subError}=await db.from("temporary_push_subscriptions").select("id,endpoint,p256dh,auth").eq("user_id",event.recipient_user_id).is("revoked_at",null)
      if(subError)throw new Error("Subscriptions unavailable")
      if(!subs?.length){status="no_subscription";reason="No active push subscriptions"}
      else{
        const body=event.event_type==="reservation_confirmed"?"Tu reserva de VERLO fue confirmada":"Tenés una acción pendiente en VERLO Temporarios"
        let successes=0
        for(const sub of subs){
          try{
            await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth}},JSON.stringify({title:"VERLO Temporarios",body,url:"https://verlo.lat/temporarios/mi-verlo",event_key:String(event.notification_id)}))
            successes++
          }catch(error:unknown){
            const statusCode=Number((error as {statusCode?:number})?.statusCode||0)
            if(statusCode===404||statusCode===410)await db.from("temporary_push_subscriptions").update({revoked_at:new Date().toISOString()}).eq("id",sub.id)
            reason="Push provider rejected one or more subscriptions"
          }
        }
        status=successes>0?"sent":"failed"
        if(!successes)reason=reason||"No push accepted"
      }
    }catch(error){status="failed";reason=error instanceof Error?error.message:"Push error"}
    const {error:finishError}=await db.rpc("temporary_finish_push",{p_id:event.id,p_status:status,p_error:reason||null})
    if(finishError)return reply(503,{ok:false,error:"Push queue update failed"})
    if(status==="sent")accepted++;else if(status==="no_subscription")noSubscription++;else failed++
  }
  return reply(200,{ok:true,processed:(events||[]).length,accepted_by_push_provider:accepted,failed,no_subscription:noSubscription})
}
