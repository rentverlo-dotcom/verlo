import {NextRequest,NextResponse} from "next/server"
import {POST as dispatchEmail} from "@/app/api/temporarios/notifications/dispatch/route"
import {POST as dispatchPush} from "@/app/api/temporarios/push/dispatch/route"
export const runtime="nodejs"
export const dynamic="force-dynamic"
export const maxDuration=240
export async function GET(request:NextRequest){
  const cronSecret=process.env.CRON_SECRET
  if(!cronSecret||request.headers.get("authorization")!==`Bearer ${cronSecret}`)return NextResponse.json({ok:false,error:"Unauthorized"},{status:401})
  if(process.env.TEMPORARY_PUBLIC_ENABLED!=="true"||process.env.TEMPORARY_DB_WRITES_ENABLED!=="true"||process.env.TEMPORARY_NOTIFICATION_DELIVERY_ENABLED!=="true"){
    return NextResponse.json({ok:true,skipped:true,reason:"Temporary delivery remains disabled"})
  }
  const deliverySecret=process.env.TEMPORARY_NOTIFICATIONS_CRON_SECRET
  if(!deliverySecret)return NextResponse.json({ok:false,error:"Temporary dispatch secret missing"},{status:503})
  const headers={authorization:`Bearer ${deliverySecret}`}
  const base="https://verlo.lat"
  const email=await dispatchEmail(new NextRequest(base+"/api/temporarios/notifications/dispatch",{method:"POST",headers}))
  const push=await dispatchPush(new NextRequest(base+"/api/temporarios/push/dispatch",{method:"POST",headers}))
  const emailResult=await email.json()
  const pushResult=await push.json()
  return NextResponse.json({ok:email.ok&&push.ok,email:{status:email.status,...emailResult},push:{status:push.status,...pushResult}},{status:email.ok&&push.ok?200:503})
}
