import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { randomUUID } from "node:crypto"
import { checkPowerMarketSigningApproval } from "@/lib/powermarket/signing-approval"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const BUCKET = "tenant-documents"
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const response = (message: string, status: number) => NextResponse.json({ok:false,error:message},{status})

function clients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anon || !service) throw new Error("Supabase unavailable")
  const options = {auth:{persistSession:false,autoRefreshToken:false}}
  return {auth:createClient(url,anon,options),db:createClient(url,service,options)}
}

/** Partner uploads the actual insurer-issued PDF, never a quotation or a draft. */
export async function POST(req: NextRequest) {
  try {
    const {auth,db} = clients()
    const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i,"").trim()
    if (!bearer) return response("No autorizado",401)
    const {data:identity,error:authError} = await auth.auth.getUser(bearer)
    if (authError || !identity.user) return response("No autorizado",401)
    const {data:partner,error:partnerError} = await db.from("caucion_partner_users")
      .select("active").eq("partner","powermarket").eq("user_id",identity.user.id).maybeSingle()
    if (partnerError || !partner?.active) return response("Operador no autorizado",403)

    const form = await req.formData()
    const policyId = String(form.get("policy_id") || "")
    const insurerName = String(form.get("insurer_name") || "").trim().slice(0,180)
    const policyNumber = String(form.get("policy_number") || "").trim().slice(0,100)
    const file = form.get("certificate")
    if (!UUID.test(policyId) || !insurerName || !policyNumber || !(file instanceof File) ||
      file.size < 100 || file.size > 12 * 1024 * 1024 || file.type !== "application/pdf")
      return response("Ingresá aseguradora, número de póliza y un PDF válido (máximo 12 MB)",400)
    const bytes = Buffer.from(await file.arrayBuffer())
    if (bytes.subarray(0,5).toString("ascii") !== "%PDF-")
      return response("El archivo no parece un PDF válido",400)

    const {data:policy,error:policyError} = await db.from("caucion_policies")
      .select("id,application_id,lead_contract_id,status,private_pdf_key")
      .eq("id",policyId).maybeSingle()
    if (policyError || !policy) return response("Registro inexistente",404)
    if (policy.status !== "payment_confirmed" || policy.private_pdf_key || !policy.lead_contract_id)
      return response("Primero se debe confirmar la operación. Un certificado emitido no se puede reemplazar aquí.",409)

    const {data:application,error:appError} = await db.from("caucion_applications")
      .select("tenant_lead_id").eq("id",policy.application_id).maybeSingle()
    const {data:contract,error:contractError} = await db.from("lead_contracts")
      .select("id,tenant_lead_id,content").eq("id",policy.lead_contract_id).maybeSingle()
    if (appError || contractError || !application || !contract ||
        contract.tenant_lead_id !== application.tenant_lead_id || typeof contract.content !== "string")
      return response("La póliza no corresponde al contrato",409)
    const approval = await checkPowerMarketSigningApproval(db,{
      contractId: contract.id, tenantLeadId:application.tenant_lead_id, contractContent:contract.content
    })
    if (!approval.allowed) return response("El contrato ya no tiene una revisión vigente aprobada",409)

    const {data:bucket,error:bucketError} = await db.storage.getBucket(BUCKET)
    if (bucketError || !bucket || bucket.public) return response("Almacenamiento privado no disponible",503)
    const key = `powermarket/policies/${policyId}/certificate/${randomUUID()}.pdf`
    const {error:uploadError} = await db.storage.from(BUCKET).upload(key,bytes,{contentType:"application/pdf",upsert:false})
    if (uploadError) return response("No se pudo guardar el certificado",503)

    const now = new Date().toISOString()
    const {data:updated,error:updateError} = await db.from("caucion_policies")
      .update({private_pdf_key:key,insurer_name:insurerName,policy_number:policyNumber,
        status:"issued",issued_at:now,updated_at:now})
      .eq("id",policyId).eq("status","payment_confirmed")
      .is("private_pdf_key",null).select("id,status,issued_at").maybeSingle()
    if (updateError || !updated) {
      await db.storage.from(BUCKET).remove([key])
      return response("La operación cambió. No se registró ninguna emisión",409)
    }
    const {error:eventError} = await db.from("caucion_events").insert({
      application_id:policy.application_id,event_key:`powermarket:policy_issued:${policyId}`,
      event_type:"policy_issued",actor_user_id:identity.user.id,
      payload:{policy_id:policyId,contract_id:contract.id,insurer_name:insurerName,policy_number:policyNumber}
    })
    if (eventError) console.error("Policy was issued, event audit insert failed",{code:eventError.code,policyId})
    return NextResponse.json({ok:true,policy:updated,certificate_available:true},{
      headers:{"Cache-Control":"no-store"}
    })
  } catch (err) {
    console.error("Caucion insurer certificate upload failed",err)
    return response("No se pudo registrar el certificado de emisión",500)
  }
}

/** An immutable PDF annex made available only to the tenant or owner of the contract. */
export async function GET(req: NextRequest) {
  try {
    const token = String(req.nextUrl.searchParams.get("token") || "")
    if (!token || token.length > 500) return response("Acceso inválido",400)
    const {db} = clients()
    const {data:access,error:accessError} = await db.from("lead_contract_access_tokens")
      .select("contract_id,lead_id,role,revoked_at,expires_at").eq("token",token).maybeSingle()
    if (accessError || !access || access.revoked_at ||
      (access.expires_at && Date.parse(access.expires_at)<Date.now()) ||
      !["tenant","owner"].includes(access.role)) return response("Acceso inválido o vencido",403)
    const {data:contract,error:contractError} = await db.from("lead_contracts")
      .select("id,tenant_lead_id,owner_lead_id").eq("id",access.contract_id).maybeSingle()
    if (contractError || !contract ||
      (access.role==="tenant"?contract.tenant_lead_id:contract.owner_lead_id)!==access.lead_id)
      return response("Este contrato no te corresponde",403)
    const {data:policies,error:policyError} = await db.from("caucion_policies")
      .select("id,application_id,private_pdf_key,insurer_name,policy_number")
      .eq("lead_contract_id",contract.id).eq("status","issued")
      .not("private_pdf_key","is",null).order("issued_at",{ascending:false}).limit(10)
    if (policyError) throw policyError
    if (!policies?.length) return response("La póliza todavía no fue emitida",404)
    const {data:apps,error:appsError} = await db.from("caucion_applications")
      .select("id").in("id",policies.map(p=>p.application_id)).eq("tenant_lead_id",contract.tenant_lead_id)
    if (appsError) throw appsError
    const ids = new Set((apps||[]).map(a=>a.id))
    const policy = policies.find(p=>ids.has(p.application_id) &&
      typeof p.private_pdf_key==="string" &&
      p.private_pdf_key.startsWith(`powermarket/policies/${p.id}/certificate/`) &&
      p.private_pdf_key.endsWith(".pdf"))
    if (!policy) return response("No hay certificado emitido para este contrato",404)
    const {data:bucket,error:bucketError} = await db.storage.getBucket(BUCKET)
    if (bucketError || !bucket || bucket.public) return response("Archivo privado no disponible",503)
    const {data:signed,error:signedError} = await db.storage.from(BUCKET).createSignedUrl(policy.private_pdf_key,60)
    if (signedError || !signed?.signedUrl) return response("No se pudo abrir el certificado",503)
    return NextResponse.json({ok:true,url:signed.signedUrl,expires_seconds:60,
      insurer_name:policy.insurer_name,policy_number:policy.policy_number},{
      headers:{"Cache-Control":"no-store"}
    })
  } catch(err) {
    console.error("Caucion certificate view failed",err)
    return response("No se pudo consultar la póliza",500)
  }
}
