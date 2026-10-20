"use client"
import {useEffect,useState} from "react"
import Link from "next/link"
import {useSearchParams} from "next/navigation"
import BrandHeader from "@/app/temporarios/BrandHeader"
import {supabase} from "@/lib/supabase/client"
import {shell,container,panel,field,fieldLabel,button} from "@/app/temporarios/brand"
type Party={fullName:string;document:string;address:string}
type Contract={id:string;status:string;document_text:string|null;document_sha256:string|null;owner_agreed_at:string|null;tenant_agreed_at:string|null;legal_data?:{owner?:Party;tenant?:Party;houseRules?:string}}
type Data={ok?:boolean;error?:string;role?:"owner"|"tenant";contract?:Contract|null;reservationStatus?:string}
const empty=():Party=>({fullName:"",document:"",address:""})
export default function ContractScreen(){
 const query=useSearchParams(),matchId=query.get("matchId")||""
 const [data,setData]=useState<Data|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState("")
 const [owner,setOwner]=useState<Party>(empty),[tenant,setTenant]=useState<Party>(empty),[rules,setRules]=useState("")
 async function call(method:"GET"|"POST",payload?:object){
  const {data:{session}}=await supabase.auth.getSession()
  if(!session?.access_token)throw Error("Iniciá sesión para continuar")
  const response=await fetch("/api/temporarios/contracts"+(method==="GET"?"?matchId="+encodeURIComponent(matchId):""),{method,headers:{Authorization:"Bearer "+session.access_token,...(method==="POST"?{"Content-Type":"application/json"}:{})},body:method==="POST"?JSON.stringify({matchId,...payload}):undefined,cache:"no-store"})
  const json=await response.json() as Data
  if(!response.ok||!json.ok)throw Error(json.error||"No se pudo consultar el contrato")
  return json
 }
 async function load(){try{setData(await call("GET"))}catch(e){setMessage(e instanceof Error?e.message:"No disponible")}}
 useEffect(()=>{if(matchId)void load()},[matchId])
 async function submit(action:"generate"|"accept"){setBusy(true);setMessage("");try{
  await call("POST",action==="generate"?{action,owner,tenant,houseRules:rules}:{action})
  await load()
  setMessage(action==="generate"?"Contrato emitido. Ambas partes deben revisarlo y aceptarlo.":"Tu aceptación quedó registrada.")
 }catch(e){setMessage(e instanceof Error?e.message:"No se pudo completar la acción")}finally{setBusy(false)}}
 async function downloadPdf(){setBusy(true);setMessage("");try{
  const {data:{session}}=await supabase.auth.getSession()
  if(!session?.access_token)throw Error("Iniciá sesión para continuar")
  const response=await fetch("/api/temporarios/contracts/pdf?matchId="+encodeURIComponent(matchId),{headers:{Authorization:"Bearer "+session.access_token},cache:"no-store"})
  if(!response.ok){const body=await response.json().catch(()=>({error:"No se pudo descargar el PDF"}));throw Error(body.error||"No se pudo descargar el PDF")}
  const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement("a")
  a.href=url;a.download="verlo-temporarios-contrato.pdf";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)
 }catch(e){setMessage(e instanceof Error?e.message:"No se pudo descargar el PDF")}finally{setBusy(false)}}
 const contract=data?.contract
 const ready=["fee_paid","deposit_pending","ready_to_block","confirmed"].includes(data?.reservationStatus||"")
 const fields=(title:string,value:Party,onChange:(p:Party)=>void)=><fieldset style={{border:"1px solid #e8dce0",padding:16,borderRadius:16,display:"grid",gap:12}}>
 <legend style={{fontWeight:900}}>{title}</legend>
 {(["fullName","document","address"] as const).map((key)=><label key={key} style={fieldLabel}>
 {key==="fullName"?"Nombre y apellido":key==="document"?"DNI o documento":"Domicilio"}
 <input style={field} value={value[key]} onChange={e=>onChange({...value,[key]:e.target.value})} maxLength={key==="address"?230:140} required/>
 </label>)}
 </fieldset>
 return <main style={shell}><BrandHeader/><div style={{...container,maxWidth:850,paddingTop:44,paddingBottom:70}}>
 <section style={panel}><p style={{fontSize:13,fontWeight:900,letterSpacing:".07em"}}>VERLO TEMPORARIOS</p>
 <h1 style={{fontWeight:950,fontSize:"clamp(34px,6vw,58px)",letterSpacing:"-.045em",marginTop:10}}>Tu contrato digital</h1>
 <p style={{color:"#655c61"}}>Revisá el documento de tu estadía. La aceptación de las condiciones comerciales no reemplaza la aceptación de este contrato.</p>
 <Link href="/temporarios/mi-verlo" style={{color:"#050002",fontWeight:800}}>← Volver a Mi VERLO</Link>
 {message&&<p role="status" style={{padding:14,background:"#fff",borderRadius:12}}>{message}</p>}
 {!contract&&data?.ok&&!ready&&<p style={{marginTop:22}}>El contrato se habilita cuando las condiciones estén aceptadas y el pago del servicio contractual esté verificado.</p>}
 {!contract&&data?.role==="owner"&&ready&&<div style={{display:"grid",gap:17,marginTop:25}}>
 <h2>Datos para el contrato</h2>
 {fields("Propietario/a",owner,setOwner)}
 {fields("Inquilino/a",tenant,setTenant)}
 <label style={fieldLabel}>Condiciones particulares acordadas<textarea style={{...field,minHeight:100}} value={rules} maxLength={1000} onChange={e=>setRules(e.target.value)}/></label>
 <p style={{fontSize:13,color:"#6b6067"}}>Antes de emitir, verificá los datos de ambas partes. El documento quedará inmutable y no podrá sobrescribirse.</p>
 <button style={button} disabled={busy} onClick={()=>void submit("generate")}>{busy?"Emitiendo...":"Generar contrato"}</button>
 </div>}
 {!contract&&data?.role==="tenant"&&ready&&<p style={{marginTop:22}}>Esperamos que el propietario prepare el contrato para que puedas revisarlo.</p>}
 {contract&&<div style={{marginTop:26,display:"grid",gap:16}}>
 <h2>Documento · Versión 1</h2>
 <div style={{whiteSpace:"pre-wrap",background:"#fff",padding:24,borderRadius:18,border:"1px solid #ecdee2",fontSize:14,lineHeight:1.65}}>{contract.document_text}</div>
 <button style={button} disabled={busy} onClick={()=>void downloadPdf()}>{busy?"Preparando PDF...":"Descargar contrato PDF (sin firma digital)"}</button>\n <p style={{fontSize:12,color:"#6e646a",overflowWrap:"anywhere"}}>Huella de integridad SHA-256: {contract.document_sha256}</p>
 <p><strong>Propietario:</strong> {contract.owner_agreed_at?"Aceptado":"Pendiente"} · <strong>Inquilino:</strong> {contract.tenant_agreed_at?"Aceptado":"Pendiente"}</p>
 {contract.status!=="agreed"&&!(data?.role==="owner"?contract.owner_agreed_at:contract.tenant_agreed_at)&&<button style={button} disabled={busy} onClick={()=>void submit("accept")}>{busy?"Guardando...":"Leí y acepto este contrato"}</button>}
 {contract.status==="agreed"&&<strong>Ambas partes aceptaron el documento. El bloqueo de fechas sigue siendo una operación separada.</strong>}
 </div>}
 </section></div></main>
}
