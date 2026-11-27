import { canonicalEmail } from "@/lib/guarantors/auth"

/** Service-role query. Never trust a browser-supplied lead/role on signing routes. */
export async function loadSignaturaContractParticipants(
  db:any, id:string, email:string, userId:string,
) {
  const {data:contract,error}=await db.from("lead_contracts")
    .select("id,content,status,owner_lead_id,tenant_lead_id,owner_agreed_at,tenant_agreed_at")
    .eq("id",id).maybeSingle()
  if(error||!contract)return null
  const {data:leads,error:leadError}=await db.from("lead_intake")
    .select("id,email").in("id",[contract.owner_lead_id,contract.tenant_lead_id])
  if(leadError||leads?.length!==2)return null
  const owner=leads.find((x:any)=>x.id===contract.owner_lead_id)
  const tenant=leads.find((x:any)=>x.id===contract.tenant_lead_id)
  if(!owner?.email||!tenant?.email)return null
  const ownerEmail=canonicalEmail(owner.email)
  const tenantEmail=canonicalEmail(tenant.email)
  const {data:guarantors,error:guarantorError}=await db.from("contract_guarantors")
    .select("id,email,full_name,dni,status,auth_user_id")
    .eq("lead_contract_id",id).limit(2)
  if(guarantorError||(guarantors||[]).length>1)return null
  const guarantor=guarantors?.[0]||null
  const role=email===ownerEmail?"owner":email===tenantEmail?"tenant":
    guarantor?.auth_user_id===userId && canonicalEmail(guarantor.email)===email?"guarantor":null
  if(!role)return null
  return {contract,ownerEmail,tenantEmail,guarantor,role}
}
