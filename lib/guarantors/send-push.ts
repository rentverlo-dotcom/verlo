import webpush from "web-push"
import { supabaseAdmin } from "@/lib/supabase/admin"

/** Future production delivery, gated independently from QA and email cutover.
 * Never send to unverified invitation contacts or silently activate Push.
 */
export async function notifyGuarantorPush(
  userId:string,
  args:{title:string;body:string;url:"/mi-verlo"},
):Promise<{sent:number;failed:number;skipped?:boolean}> {
  if(process.env.VERCEL_ENV!=="production" ||
    process.env.VERLO_GUARANTOR_PUSH_LIVE!=="true" ||
    process.env.SIGNATURA_CONTRACT_PRODUCTION_APPROVED!=="true")
    return {sent:0,failed:0,skipped:true}
  const pub=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv=process.env.VAPID_PRIVATE_KEY
  const subject=process.env.VAPID_SUBJECT
  if(!pub||!priv||!subject) return {sent:0,failed:0,skipped:true}
  const {data:guarantors,error:identityError}=await supabaseAdmin
    .from("contract_guarantors").select("id").eq("auth_user_id",userId)
    .eq("status","accepted").limit(1)
  if(identityError||!guarantors?.length)return {sent:0,failed:0,skipped:true}
  const {data:subscriptions,error}=await supabaseAdmin
    .from("guarantor_push_subscriptions")
    .select("id,endpoint,p256dh,auth").eq("auth_user_id",userId)
    .is("revoked_at",null).limit(20)
  if(error)throw new Error("Push subscriptions unavailable")
  webpush.setVapidDetails(subject,pub,priv)
  let sent=0,failed=0
  for(const sub of subscriptions||[]){
    try{
      await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth}},
        JSON.stringify({title:args.title,body:args.body,url:args.url}))
      sent+=1
    }catch(err){
      failed+=1
      const status=(err as {statusCode?:number})?.statusCode
      if(status===404||status===410){
        await supabaseAdmin.from("guarantor_push_subscriptions")
          .update({revoked_at:new Date().toISOString()}).eq("id",sub.id)
      }
    }
  }
  return {sent,failed}
}
