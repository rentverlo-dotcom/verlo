"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import VerloBrand from "@/components/VerloBrand"

type Application = {
 id:string;tenant_lead_id:string;status:string;requested_rent_ars:number;estimated_expenses_ars:number;monthly_income_ars:number;
 duration_months:number;employment_type:string;has_co_tenant:boolean;co_tenant_income_ars:number|null;
 approved_max_total_ars:number|null;approved_max_rent_ars:number|null;created_at:string;tenant?:{full_name:string|null;email:string|null;phone:string|null}|null
}
const url=process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase=createClient(url,anon)
const money=(value:number|null)=>value==null?"—":new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(value)
export default function PowerMarketDashboard(){
 const [items,setItems]=useState<Application[]>([])
 const [error,setError]=useState("")
 const [loading,setLoading]=useState(true)
 const [email,setEmail]=useState("")
 const [password,setPassword]=useState("")
 const [logged,setLogged]=useState(false)
 const [busy,setBusy]=useState("")
 const [amounts,setAmounts]=useState<Record<string,string>>({})
 const [notes,setNotes]=useState<Record<string,string>>({})
 const [docs,setDocs]=useState<Record<string,{id:string;kind:string;original_filename:string|null}[]>>({})
 async function token(){return (await supabase.auth.getSession()).data.session?.access_token}
 async function refresh(){
  const access=await token()
  if(!access){setLogged(false);setLoading(false);return}
  setLogged(true)
  const res=await fetch("/api/powermarket/applications",{headers:{Authorization:`Bearer ${access}`},cache:"no-store"})
  const data=await res.json().catch(()=>({}))
  if(!res.ok){setError(data.error||"No se pudo cargar");setItems([])}
  else {setError("");setItems(data.applications||[])}
  setLoading(false)
 }
 useEffect(()=>{void refresh()},[])
 async function login(e:React.FormEvent){e.preventDefault();setError("");const {error:err}=await supabase.auth.signInWithPassword({email,password});if(err){setError("Credenciales incorrectas");return}setPassword("");setLoading(true);await refresh()}
 async function decide(id:string,status:string){
  if(busy)return
  setBusy(id);setError("")
  const access=await token()
  const res=await fetch("/api/powermarket/applications",{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${access}`},body:JSON.stringify({id,status,approved_max_total_ars:amounts[id]||null,note:notes[id]||""})})
  const data=await res.json().catch(()=>({}))
  if(!res.ok)setError(data.error||"No se pudo guardar")
  await refresh();setBusy("")
 }
 async function viewDocuments(id:string){const access=await token();if(!access)return;const res=await fetch(`/api/powermarket/partner-documents?application_id=${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${access}`},cache:"no-store"});const data=await res.json().catch(()=>({}));if(!res.ok){setError(data.error||"No se pudieron consultar documentos");return}setDocs(v=>({...v,[id]:data.documents||[]}))}
 async function openDocument(applicationId:string,documentId:string){const access=await token();if(!access)return;const res=await fetch("/api/powermarket/partner-documents",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${access}`},body:JSON.stringify({application_id:applicationId,document_id:documentId})});const data=await res.json().catch(()=>({}));if(res.ok&&data.url){window.open(data.url,"_blank","noopener,noreferrer")}else setError(data.error||"No se pudo abrir el archivo")}
 const base:React.CSSProperties={fontFamily:"system-ui,sans-serif",maxWidth:1100,margin:"36px auto",padding:"0 20px",color:"#050002"}
 const field:React.CSSProperties={padding:"10px 12px",border:"1px solid #ccd4df",borderRadius:8,width:"100%",boxSizing:"border-box"}
 const btn:React.CSSProperties={padding:"9px 12px",border:0,borderRadius:8,background:"#050002",color:"#fff",cursor:"pointer"}
 return <main style={base}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,padding:"12px 0 22px",marginBottom:24,borderBottom:"1px solid rgba(5,0,2,0.12)",background:"transparent"}}><div style={{minWidth:0}}><VerloBrand width={42}/><div style={{fontSize:14,fontWeight:650,color:"#050002",marginTop:12}}>PowerMarket · Gestión de cauciones</div></div>{logged&&<button style={btn} onClick={async()=>{await supabase.auth.signOut();setLogged(false);setItems([])}}>Cerrar sesión</button>}</div>
 {error&&<p role="alert" style={{color:"#a52727"}}>{error}</p>}
 {!logged&&!loading&&<form onSubmit={login} style={{maxWidth:380,display:"grid",gap:12,marginTop:30}}><label>Email<input style={field} type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Contraseña<input style={field} type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button style={btn}>Ingresar</button><small>El acceso requiere autorización previa de VERLO.</small></form>}
 {loading&&<p>Cargando…</p>}
 {logged&&!loading&&<><p><strong>{items.length}</strong> solicitudes visibles (últimas 100)</p>
 <div style={{display:"grid",gap:16}}>{items.map(item=><article key={item.id} style={{border:"1px solid #dce2e8",borderRadius:12,padding:20}}>
 <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><strong>Solicitud {item.id.slice(0,8)}</strong><span>{item.status}</span></div>
 <p>Alquiler: <b>{money(item.requested_rent_ars)}</b> · Expensas: <b>{money(item.estimated_expenses_ars)}</b> · Ingresos: <b>{money(item.monthly_income_ars)}</b></p>
 <p>Plazo: {item.duration_months} meses · Ingresos: {item.employment_type} · Co-inquilino: {item.has_co_tenant?"Sí":"No"} {item.has_co_tenant?(`(${money(item.co_tenant_income_ars)})`):""}</p>
 <p><strong>Interesado: {item.tenant?.full_name||"Sin nombre"}</strong><br/>Email: {item.tenant?.email||"No informado"} · Teléfono: {item.tenant?.phone||"No informado"}</p>
 <p style={{fontSize:13,color:"#64748b"}}>Solicitud: {new Date(item.created_at).toLocaleString("es-AR")} · ID inquilino: {item.tenant_lead_id}</p>
 <div style={{marginBottom:16}}><button style={btn} onClick={()=>viewDocuments(item.id)}>Ver documentación</button>{docs[item.id]&&<ul>{docs[item.id].length===0?<li>Sin comprobantes cargados</li>:docs[item.id].map(doc=><li key={doc.id}><button style={{...btn,marginTop:6}} onClick={()=>openDocument(item.id,doc.id)}>Abrir: {doc.original_filename||doc.kind}</button></li>)}</ul>}</div>
 <label style={{display:"block",maxWidth:340}}>Límite aprobado total (alquiler + expensas), ARS<input style={field} type="number" min="0" value={amounts[item.id]??String(item.approved_max_total_ars??"")} onChange={e=>setAmounts(v=>({...v,[item.id]:e.target.value}))}/></label>
 <label style={{display:"block",marginTop:10}}>Observación<textarea style={{...field,minHeight:65}} value={notes[item.id]||""} onChange={e=>setNotes(v=>({...v,[item.id]:e.target.value}))}/></label>
 <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>{[["under_review","En evaluación"],["more_info_required","Pedir información"],["prequalified","Precalificar"],["alternative_offered","Ofrecer monto menor"],["not_eligible","Rechazar"]].map(([status,label])=><button key={status} style={btn} disabled={busy===item.id} onClick={()=>decide(item.id,status)}>{label}</button>)}</div>
 </article>)}</div>{items.length===0&&<p>No hay solicitudes presentadas todavía.</p>}</>}
 </main>
}
