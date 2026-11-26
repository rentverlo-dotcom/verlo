"use client"
import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

type Document = {id:string;kind:string;original_name:string;bytes:number;created_at:string;document_revision:number}
type Guarantee = {
 id:string;fullName:string;guaranteeKind:string;status:string;reviewStatus:string;reviewReason:string|null;
 documentRevision:number;approvedRevision:number|null;
 collateralAddress:string|null;collateralJurisdiction:string|null;
 collateralRegistration:string|null;collateralOwner:string|null
}
type Snapshot = {ok:boolean;role:"guarantor"|"owner";guarantor:Guarantee;documents:Document[]}
const labels:Record<string,string>={
 deed:"Escritura o título",identity:"DNI",income:"Recibo / ingresos",
 ownership_report:"Informe de dominio",inhibition_report:"Informe de inhibiciones",other:"Otro documento",
}
const statusLabels:Record<string,string>={
 awaiting_documents:"Documentación pendiente",submitted:"Documentación presentada",
 under_review:"En revisión",changes_requested:"Correcciones solicitadas",
 rejected:"Garantía rechazada",approved:"Garantía aprobada",
}
async function bearer(){
 const {data}=await supabase.auth.getSession()
 if(!data.session)throw new Error("Iniciá sesión en Mi VERLO")
 return data.session.access_token
}
async function call(id:string,method:"GET"|"POST"|"PATCH",body?:object){
 const token=await bearer()
 const url="/api/guarantors/dossier"+(method==="GET"?"?guarantorId="+encodeURIComponent(id):"")
 const res=await fetch(url,{method,cache:"no-store",headers:{
   Authorization:`Bearer ${token}`,...(method!=="GET"?{"Content-Type":"application/json"}:{})
 },...(method!=="GET"?{body:JSON.stringify({guarantorId:id,...body})}:{})})
 const result=await res.json().catch(()=>({}))
 if(!res.ok)throw new Error(result.error||"Operación no disponible")
 return result
}
export default function GuarantorDossier({guarantorId}:{guarantorId:string}) {
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null)
 const [error,setError]=useState("")
 const [message,setMessage]=useState("")
 const [busy,setBusy]=useState(false)
 const [kind,setKind]=useState("deed")
 const [file,setFile]=useState<File|null>(null)
 const [reason,setReason]=useState("")
 const [details,setDetails]=useState({collateralAddress:"",collateralJurisdiction:"",
   collateralRegistration:"",collateralOwner:""})
 const refresh=useCallback(async()=>{
   const result=await call(guarantorId,"GET")
   setSnapshot(result)
   setDetails({
     collateralAddress:result.guarantor.collateralAddress||"",
     collateralJurisdiction:result.guarantor.collateralJurisdiction||"",
     collateralRegistration:result.guarantor.collateralRegistration||"",
     collateralOwner:result.guarantor.collateralOwner||"",
   })
 },[guarantorId])
 useEffect(()=>{let active=true;void (async()=>{
   try{const result=await call(guarantorId,"GET");if(active){setSnapshot(result);setDetails({
     collateralAddress:result.guarantor.collateralAddress||"",
     collateralJurisdiction:result.guarantor.collateralJurisdiction||"",
     collateralRegistration:result.guarantor.collateralRegistration||"",
     collateralOwner:result.guarantor.collateralOwner||"",
   })}}
   catch(e){if(active)setError(e instanceof Error?e.message:"No disponible")}
 })();return()=>{active=false}},[guarantorId])
 async function execute(fn:()=>Promise<void>){
   setBusy(true);setError("");setMessage("")
   try{await fn();await refresh()}catch(e){setError(e instanceof Error?e.message:"No se pudo completar")}
   finally{setBusy(false)}
 }
 async function upload(){
   if(!file)throw new Error("Seleccioná un archivo")
   if(file.size>10*1024*1024||file.size<100)throw new Error("Máximo 10 MB; archivo vacío no permitido")
   const type=file.type
   if(!["application/pdf","image/jpeg","image/png"].includes(type))
     throw new Error("Se admiten PDF, JPG o PNG")
   const signed=await call(guarantorId,"POST",{
     action:"presign",kind,mimeType:type,bytes:file.size,name:file.name,
   })
   // Browser sends the file directly to the isolated private bucket.
   const {error:uploadError}=await supabase.storage.from("private-documents")
     .uploadToSignedUrl(signed.path,signed.token,file,{contentType:type,upsert:false})
   if(uploadError)throw new Error("No se pudo cargar el archivo privado")
   await call(guarantorId,"POST",{
     action:"confirm",path:signed.path,kind,mimeType:type,bytes:file.size,name:file.name,
   })
   setFile(null)
   setMessage("Documento guardado en tu expediente privado.")
 }
 async function openDocument(documentId:string){
   const tab=window.open("","_blank")
   try{
     const result=await call(guarantorId,"PATCH",{documentId})
     if(tab)tab.location.href=result.url
     else setError("Permití ventanas emergentes para consultar el documento")
   }catch(e){tab?.close();setError(e instanceof Error?e.message:"No se pudo abrir")}
 }
 async function review(decision:string){
   const result=await call(guarantorId,"POST",{action:"decision",decision,reason})
   setMessage("Decisión registrada: "+(statusLabels[result.reviewStatus]||result.reviewStatus))
 }
 if(!snapshot)return <div>{error?<p role="alert">{error}</p>:<p>Cargando expediente privado…</p>}</div>
 const owner=snapshot.role==="owner"
 const g=snapshot.guarantor
 const choices=owner?["ownership_report","inhibition_report"]:["deed","identity","income","other"]
 const selectedKind=choices.includes(kind)?kind:choices[0]
 return <section style={{padding:20,border:"1px solid #e4d7d9",borderRadius:18,margin:"16px 0",background:"#fff",color:"#050002"}}>
   <h3>{owner?"Revisar garantía":"Presentar documentación de garantía"}</h3>
   <p><strong>{g.fullName}</strong> · {g.guaranteeKind==="property"?"Garantía propietaria":g.guaranteeKind==="salary"?"Ingresos":"Fianza personal"}</p>
   <p><strong>Estado:</strong> {statusLabels[g.reviewStatus]||g.reviewStatus}</p>
   {g.reviewReason&&<p>Observaciones: {g.reviewReason}</p>}
   {!owner&&g.status==="accepted"&&g.guaranteeKind==="property"&&<form onSubmit={e=>{
     e.preventDefault();void execute(async()=>{
       await call(guarantorId,"POST",{action:"details",...details})
       setMessage("Datos de la propiedad guardados. Presentá tu escritura.")
     })
   }} style={{display:"grid",gap:8,margin:"14px 0"}}>
     <p>Inmueble ofrecido como garantía</p>
     {([
       ["collateralAddress","Dirección del inmueble"],
       ["collateralJurisdiction","Provincia / jurisdicción"],
       ["collateralRegistration","Matrícula registral"],
       ["collateralOwner","Titular del inmueble"],
     ] as const).map(([key,label])=><label key={key}>{label}
       <input required value={details[key]} onChange={e=>setDetails(d=>({...d,[key]:e.target.value}))}
         style={{display:"block",width:"100%",padding:10,marginTop:4}}/>
     </label>)}
     <button type="submit" disabled={busy}>Guardar datos de la garantía</button>
   </form>}
   {g.guaranteeKind==="property"&&owner&&<div>
     <p><strong>Inmueble:</strong> {g.collateralAddress||"Pendiente"}</p>
     <p><strong>Jurisdicción:</strong> {g.collateralJurisdiction||"Pendiente"}</p>
     <p><strong>Matrícula:</strong> {g.collateralRegistration||"Pendiente"}</p>
     <p><strong>Titular declarado:</strong> {g.collateralOwner||"Pendiente"}</p>
   </div>}
   <h4>Documentación privada</h4>
   {snapshot.documents.length===0?<p>Todavía no se presentaron documentos.</p>:<ul>
     {snapshot.documents.map(d=><li key={d.id} style={{padding:6}}>
       {labels[d.kind]||d.kind}: {d.original_name}
       {" "}<button type="button" onClick={()=>void openDocument(d.id)}>Ver documento</button>
     </li>)}
   </ul>}
   {(!owner?g.status==="accepted":g.reviewStatus!=="awaiting_documents")&&<div style={{display:"grid",gap:8,margin:"12px 0"}}>
     <label>Tipo de documento<select value={selectedKind} onChange={e=>setKind(e.target.value)}>
       {choices.map(k=><option key={k} value={k}>{labels[k]}</option>)}
     </select></label>
     <label>Archivo PDF, JPG o PNG (máximo 10 MB)
       <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
         onChange={e=>setFile(e.target.files?.[0]||null)}/>
     </label>
     <button type="button" disabled={busy||!file} onClick={()=>void execute(upload)}>
       {busy?"Guardando…":"Subir documento al expediente"}
     </button>
   </div>}
   {owner&&<div style={{marginTop:16,display:"grid",gap:10}}>
     <p>Solicitá los certificados oficiales por fuera de VERLO. Luego incorporalos al expediente y registrá tu decisión.</p>
     <label>Observaciones o motivo<textarea value={reason} onChange={e=>setReason(e.target.value)}
       rows={3} style={{display:"block",width:"100%"}}/></label>
     <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
       {(["under_review","changes_requested","rejected","approved"] as const).map(d=>
         <button key={d} type="button" disabled={busy} onClick={()=>void execute(()=>review(d))}>
           {d==="under_review"?"En revisión":d==="changes_requested"?"Pedir corrección":d==="rejected"?"Rechazar":"Aprobar garantía"}
         </button>)}
     </div>
     <p style={{fontSize:12,color:"#666"}}>La aprobación es una decisión del propietario, no un certificado emitido por VERLO. No habilita firma si faltan otros controles.</p>
   </div>}
   {error&&<p role="alert">{error}</p>}
   {message&&<p role="status">{message}</p>}
 </section>
}
