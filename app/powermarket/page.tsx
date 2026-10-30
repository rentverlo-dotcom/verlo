"use client"
import { useEffect, useMemo, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import VerloBrand from "@/components/VerloBrand"

type Application = {
 id:string;tenant_lead_id:string;status:string;requested_rent_ars:number;estimated_expenses_ars:number;monthly_income_ars:number;
 duration_months:number;employment_type:string;has_co_tenant:boolean;co_tenant_income_ars:number|null;
 approved_max_total_ars:number|null;approved_max_rent_ars:number|null;decision_expires_at:string|null;created_at:string;
 tenant?:{full_name:string|null;email:string|null;phone:string|null}|null
}
type DocumentRow={id:string;kind:string;original_filename:string|null}
const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const money=(n:number|null|undefined)=>n==null?"—":new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(n)
const labels:Record<string,string>={submitted:"Nueva",under_review:"En evaluación",more_info_required:"Documentación pendiente",prequalified:"Precalificada",not_eligible:"Rechazada",alternative_offered:"Monto alternativo",expired:"Vencida",withdrawn:"Retirada"}
const actions=[["under_review","En evaluación"],["more_info_required","Pedir documentación"],["prequalified","Precalificar"],["alternative_offered","Ofrecer otro monto"],["not_eligible","Rechazar"]]
export default function PowerMarketDashboard(){
 const [items,setItems]=useState<Application[]>([]),[selected,setSelected]=useState<string|null>(null)
 const [error,setError]=useState(""),[loading,setLoading]=useState(true),[email,setEmail]=useState(""),[password,setPassword]=useState("")
 const [logged,setLogged]=useState(false),[busy,setBusy]=useState(false),[filter,setFilter]=useState("all"),[search,setSearch]=useState("")
 const [amount,setAmount]=useState(""),[note,setNote]=useState(""),[docs,setDocs]=useState<DocumentRow[]|null>(null)
 const current=items.find(item=>item.id===selected)||null
 const visible=useMemo(()=>items.filter(item=>(filter==="all"||item.status===filter)&&(!search||[item.tenant?.full_name,item.tenant?.email,item.tenant?.phone,item.id].some(v=>String(v||"").toLowerCase().includes(search.toLowerCase())))),[items,filter,search])
 const counts={new:items.filter(i=>i.status==="submitted").length,review:items.filter(i=>["under_review","more_info_required"].includes(i.status)).length,approved:items.filter(i=>["prequalified","alternative_offered"].includes(i.status)).length}
 async function token(){return (await supabase.auth.getSession()).data.session?.access_token}
 async function refresh(){
  const access=await token()
  if(!access){setLogged(false);setLoading(false);return}
  const res=await fetch("/api/powermarket/applications",{headers:{Authorization:`Bearer ${access}`},cache:"no-store"})
  const json=await res.json().catch(()=>({}))
  if(!res.ok){setError(json.error||"Acceso denegado");setItems([]);setLogged(false)}
  else{setError("");setItems(json.applications||[]);setLogged(true)}
  setLoading(false)
 }
 useEffect(()=>{void refresh()},[])
 function select(item:Application){setSelected(item.id);setDocs(null);setNote("");setAmount(String(item.approved_max_total_ars??""))}
 async function login(e:React.FormEvent){e.preventDefault();setError("");setBusy(true);const {error:err}=await supabase.auth.signInWithPassword({email,password});setBusy(false);if(err){setError("Credenciales incorrectas");return}setPassword("");setLoading(true);await refresh()}
 async function decide(status:string){
  if(!current||busy)return
  setBusy(true);setError("")
  const access=await token()
  const res=await fetch("/api/powermarket/applications",{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${access}`},body:JSON.stringify({id:current.id,status,approved_max_total_ars:amount===""?null:Number(amount),note})})
  const data=await res.json().catch(()=>({}))
  if(!res.ok)setError(data.error||"No se pudo guardar")
  await refresh();setBusy(false)
 }
 async function documents(){
  if(!current)return
  const access=await token()
  const res=await fetch(`/api/powermarket/partner-documents?application_id=${encodeURIComponent(current.id)}`,{headers:{Authorization:`Bearer ${access}`},cache:"no-store"})
  const data=await res.json().catch(()=>({}))
  if(!res.ok)setError(data.error||"No se pudo consultar");else setDocs(data.documents||[])
 }
 async function openDoc(id:string){
  if(!current)return
  const access=await token()
  const win=window.open("","_blank")
  const res=await fetch("/api/powermarket/partner-documents",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${access}`},body:JSON.stringify({application_id:current.id,document_id:id})})
  const data=await res.json().catch(()=>({}))
  if(res.ok&&data.url){if(win)win.location.href=data.url;else setError("Permití ventanas emergentes para abrir el comprobante")}
  else{win?.close();setError(data.error||"No se pudo abrir el archivo")}
 }
 const control:React.CSSProperties={background:"#fff",color:"#050002",border:"1px solid #ddd5d7",borderRadius:12,padding:"11px 13px",width:"100%",fontSize:14}
 const button:React.CSSProperties={background:"#050002",color:"#fff",border:0,borderRadius:999,padding:"11px 17px",fontWeight:700,cursor:"pointer",fontSize:13}
 const cell:React.CSSProperties={padding:"14px 12px",borderBottom:"1px solid #eee6e8",verticalAlign:"middle",fontSize:13,textAlign:"left"}
 return <main style={{background:"#f2ebec",minHeight:"100vh",padding:"26px 20px 80px",color:"#050002",fontFamily:"Inter,system-ui,sans-serif",fontSize:14}}>
 <div style={{maxWidth:1180,margin:"0 auto"}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,background:"#f2ebec",borderBottom:"1px solid #dfd2d6",padding:"0 0 20px",position:"relative",top:"auto",backdropFilter:"none"}}>
   <div><VerloBrand width={42}/><div style={{fontSize:14,fontWeight:750,marginTop:11}}>PowerMarket · Gestión de cauciones</div></div>
   {logged&&<button style={button} onClick={async()=>{await supabase.auth.signOut();setLogged(false);setItems([]);setSelected(null)}}>Cerrar sesión</button>}
  </div>
  {error&&<p role="alert" style={{background:"#fff",border:"1px solid #c37986",borderRadius:10,padding:12,color:"#892b40"}}>{error}</p>}
  {loading?<p style={{marginTop:28}}>Cargando…</p>:!logged?
   <form onSubmit={login} style={{background:"#fff",maxWidth:420,padding:28,borderRadius:20,marginTop:32,display:"grid",gap:15}}>
    <h1 style={{fontSize:24,lineHeight:1.2,margin:0}}>Acceso privado</h1>
    <label>Email<input type="email" style={{...control,display:"block",marginTop:6}} required value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label>Contraseña<input type="password" style={{...control,display:"block",marginTop:6}} required value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <button style={button} disabled={busy}>Ingresar</button>
    <small>Acceso exclusivo para operadores autorizados por VERLO.</small>
   </form>:
   <div style={{paddingTop:28}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",flexWrap:"wrap",gap:8,marginBottom:18}}>
     <h1 style={{fontSize:27,lineHeight:1.2,margin:0}}>Solicitudes de caución</h1><span style={{color:"#66565b"}}>{items.length} registros · últimas 100 solicitudes</span>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,marginBottom:20}}>
     {[[counts.new,"Nuevas"],[counts.review,"En evaluación"],[counts.approved,"Precalificadas"]].map(([count,label])=><div key={label} style={{background:"#fff",border:"1px solid #e7dde0",borderRadius:16,padding:18}}><div style={{fontSize:29,fontWeight:800}}>{count}</div><div style={{color:"#66565b"}}>{label}</div></div>)}
    </div>
    <div style={{background:"#fff",border:"1px solid #e7dde0",borderRadius:18,overflow:"hidden"}}>
     <div style={{padding:16,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
      <input aria-label="Buscar interesado" placeholder="Buscar nombre, email o teléfono" value={search} onChange={e=>setSearch(e.target.value)} style={{...control,maxWidth:340}}/>
      <select aria-label="Filtrar estado" value={filter} onChange={e=>setFilter(e.target.value)} style={{...control,maxWidth:230}}><option value="all">Todos los estados</option>{Object.entries(labels).map(([k,v])=><option value={k} key={k}>{v}</option>)}</select>
      <button onClick={()=>void refresh()} style={{...button,marginLeft:"auto"}}>Actualizar</button>
     </div>
     <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:760}}>
      <thead><tr style={{background:"#f8f4f5"}}>{["Interesado","Alquiler + expensas","Ingresos","Estado","Fecha",""].map(t=><th key={t} style={{...cell,fontWeight:750}}>{t}</th>)}</tr></thead>
      <tbody>{visible.map(item=><tr key={item.id}>
       <td style={cell}><strong>{item.tenant?.full_name||"Sin nombre"}</strong><div style={{color:"#66565b",fontSize:12}}>{item.tenant?.email||"Sin email"}</div></td>
       <td style={cell}>{money(Number(item.requested_rent_ars)+Number(item.estimated_expenses_ars))}</td><td style={cell}>{money(item.monthly_income_ars)}</td>
       <td style={cell}>{labels[item.status]||item.status}</td><td style={cell}>{new Date(item.created_at).toLocaleDateString("es-AR")}</td>
       <td style={cell}><button style={button} onClick={()=>select(item)}>Ver ficha</button></td>
      </tr>)}</tbody>
     </table>{visible.length===0&&<p style={{padding:"12px 20px",color:"#66565b"}}>No hay solicitudes para mostrar.</p>}</div>
    </div>
    {current&&<section style={{background:"#fff",marginTop:18,padding:"22px",borderRadius:18,border:"1px solid #e7dde0"}}>
     <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}><h2 style={{fontSize:21,margin:0}}>Ficha · {current.tenant?.full_name||"Interesado"}</h2><button style={button} onClick={()=>setSelected(null)}>Cerrar ficha</button></div>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:18,marginTop:20}}>
      <div><strong>Contacto</strong><p>Email: {current.tenant?.email||"No informado"}<br/>Teléfono: {current.tenant?.phone||"No informado"}</p><p>Estado: {labels[current.status]||current.status}</p></div>
      <div><strong>Solicitud</strong><p>Alquiler: {money(current.requested_rent_ars)}<br/>Expensas: {money(current.estimated_expenses_ars)}<br/>Plazo: {current.duration_months} meses</p></div>
      <div><strong>Ingresos</strong><p>Declarados: {money(current.monthly_income_ars)}<br/>Tipo: {current.employment_type}<br/>Co-inquilino: {current.has_co_tenant?money(current.co_tenant_income_ars):"No"}</p></div>
     </div>
     <div style={{borderTop:"1px solid #eee6e8",paddingTop:17,marginTop:8}}>
      <button style={button} onClick={()=>void documents()}>Consultar comprobantes</button>
      {docs&&<div style={{marginTop:12}}>{docs.length===0?"No hay comprobantes cargados.":docs.map(doc=><div key={doc.id} style={{marginBottom:9}}><button style={{...button,background:"#f2ebec",color:"#050002"}} onClick={()=>void openDoc(doc.id)}>Abrir {doc.original_filename||doc.kind}</button></div>)}</div>}
     </div>
     <div style={{borderTop:"1px solid #eee6e8",paddingTop:18,marginTop:18}}>
      <h3 style={{fontSize:17,margin:"0 0 14px"}}>Decisión de PowerMarket</h3>
      <label style={{display:"block",maxWidth:380}}>Límite precalificado, alquiler + expensas (ARS)<input type="number" min="0" style={{...control,display:"block",marginTop:7}} value={amount} onChange={e=>setAmount(e.target.value)}/></label>
      <label style={{display:"block",marginTop:12}}>Observaciones<textarea value={note} onChange={e=>setNote(e.target.value)} style={{...control,display:"block",marginTop:7,minHeight:75}}/></label>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:15}}>{actions.map(([status,label])=><button disabled={busy} key={status} style={button} onClick={()=>void decide(status)}>{label}</button>)}</div>
     </div>
    </section>}
   </div>}
 </div></main>
}