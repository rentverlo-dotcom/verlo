import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyCaucionLead } from "@/lib/powermarket/lead-token"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const BUCKET = "tenant-documents"
const kinds = new Set(["salary_receipt","billing_proof","co_tenant_income_proof"])
const mime = new Set(["application/pdf","image/jpeg","image/png","image/webp"])
const MAX = 8 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const leadId = verifyCaucionLead(String(form.get("access") || ""))
    const applicationId = String(form.get("application_id") || "")
    const kind = String(form.get("kind") || "")
    const file = form.get("file")
    if (!leadId || !/^[a-f\d-]{36}$/i.test(applicationId) || !kinds.has(kind) || !(file instanceof File) || !mime.has(file.type) || file.size > MAX || file.size === 0) {
      return NextResponse.json({ error: "Archivo o autorización inválidos (máximo 8 MB, PDF o imagen)" }, { status: 400 })
    }
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: application, error: appError } = await db.from("caucion_applications")
      .select("id,status").eq("id", applicationId).eq("tenant_lead_id", leadId).single()
    if (appError || !application || !["submitted","more_info_required"].includes(application.status)) {
      return NextResponse.json({error:"Solicitud inexistente o cerrada"},{status:403})
    }
    const { data:bucket,error:bucketError } = await db.storage.getBucket(BUCKET)
    if (bucketError || !bucket || bucket.public) {
      return NextResponse.json({error:"El almacenamiento privado no está disponible"},{status:503})
    }
    const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
    const key = `powermarket/${applicationId}/${kind}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await db.storage.from(BUCKET).upload(key, Buffer.from(await file.arrayBuffer()), {contentType:file.type,upsert:false})
    if(uploadError) throw uploadError
    const {error:insertError}=await db.from("caucion_documents").insert({application_id:applicationId,kind,private_storage_key:key,storage_provider:"supabase",original_filename:file.name.slice(0,180)})
    if(insertError) {
      await db.storage.from(BUCKET).remove([key])
      throw insertError
    }
    return NextResponse.json({ok:true,kind})
  }catch(err){
    console.error("PowerMarket private upload failed",err)
    return NextResponse.json({error:"No pudimos guardar el comprobante"},{status:500})
  }
}
