"use client"
import {useState} from "react"
import VerloBrand from "@/components/VerloBrand"
export default function CaucionApplication(){
 const [rent,setRent]=useState(""),[expenses,setExpenses]=useState(""),[income,setIncome]=useState(""),[months,setMonths]=useState("24")
 const [employment,setEmployment]=useState("salary_receipt"),[hasCo,setHasCo]=useState(false),[coIncome,setCoIncome]=useState("")
 const [applicationId,setApplicationId]=useState(""),[uploadMessage,setUploadMessage]=useState(""),[uploading,setUploading]=useState(false)
 const [consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[done,setDone]=useState(false)
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage("")
  const access=new URLSearchParams(window.location.search).get("access")
  const res=await fetch("/api/powermarket/apply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({access,rent:Number(rent),expenses:Number(expenses),income:Number(income),months:Number(months),employment,hasCo,coIncome:hasCo?Number(coIncome):null,consent})}).catch(()=>null)
  const data=await res?.json().catch(()=>({}))
  if(res?.ok&&data?.ok){setApplicationId(data.application_id||"");setDone(true)}
  else setMessage(data?.error||"No pudimos enviar tu solicitud")
  setBusy(false)
 }
 async function upload(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setUploading(true);setUploadMessage("");const form=e.currentTarget;const data=new FormData(form);data.set("access",new URLSearchParams(window.location.search).get("access")||"");data.set("application_id",applicationId);const res=await fetch("/api/powermarket/documents",{method:"POST",body:data}).catch(()=>null);const result=await res?.json().catch(()=>({}));setUploadMessage(res?.ok?"Comprobante guardado. Podés subir otro.":result?.error||"Error al subir");if(res?.ok)form.reset();setUploading(false)}
 const input:React.CSSProperties={display:"block",width:"100%",boxSizing:"border-box",padding:12,border:"1px solid #ccd4dc",borderRadius:8,marginTop:6}
 const label:React.CSSProperties={display:"block",marginBottom:16}
 return <main style={{minHeight:"100vh",padding:"0 20px 64px",fontFamily:"Inter,system-ui,sans-serif",color:"#050002",background:"radial-gradient(circle at 8% 4%,rgba(242,168,169,.38),transparent 30%),radial-gradient(circle at 92% 32%,rgba(231,199,118,.18),transparent 25%),#f2ebec"}}>
  <div role="navigation" aria-label="Navegación VERLO" style={{maxWidth:1080,margin:"0 auto",minHeight:80,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,background:"transparent",position:"relative"}}><VerloBrand width={42}/><a href="/mi-verlo" style={{color:"#050002",fontSize:14,fontWeight:650,textDecoration:"underline"}}>Mi VERLO</a></div>
  <section style={{maxWidth:640,margin:"24px auto",padding:"clamp(20px,5vw,36px)",background:"#fff",borderRadius:22,border:"1px solid rgba(5,0,2,.10)",boxShadow:"0 14px 40px rgba(5,0,2,.06)"}}>
  <h1>Precalificá tu seguro de caución</h1><p>PowerMarket evaluará tu capacidad económica. La solicitud es independiente de tus coincidencias en VERLO.</p>
  {done?<section><h2>Solicitud enviada</h2><p>PowerMarket revisará tus datos. VERLO te informará los próximos pasos por email.</p><form onSubmit={upload} style={{display:"grid",gap:12}}><h3>Comprobantes de ingresos</h3><p>Adjuntá los últimos tres recibos de sueldo o la documentación de facturación correspondiente. No subas el DNI en este formulario.</p><select style={input} name="kind" required><option value="salary_receipt">Recibo de sueldo</option><option value="billing_proof">Factura / comprobante monotributo</option><option value="co_tenant_income_proof">Ingresos del co-inquilino</option></select><input style={input} name="file" type="file" accept=".pdf,image/jpeg,image/png,image/webp" required/><button disabled={uploading||!applicationId} style={{background:"#050002",color:"white",padding:12,border:0,borderRadius:12}}>{uploading?"Subiendo…":"Guardar comprobante"}</button>{uploadMessage&&<p role="status">{uploadMessage}</p>}</form><p><a href="/mi-verlo">Ir a Mi VERLO</a></p></section>:
  <form onSubmit={submit}>
   <label style={label}>Alquiler mensual estimado (ARS)<input style={input} type="number" min="1" required value={rent} onChange={e=>setRent(e.target.value)}/></label>
   <label style={label}>Expensas mensuales estimadas (ARS; 0 si no corresponde)<input style={input} type="number" min="0" required value={expenses} onChange={e=>setExpenses(e.target.value)}/></label>
   <label style={label}>Duración del contrato en meses<input style={input} type="number" min="1" max="120" required value={months} onChange={e=>setMonths(e.target.value)}/></label>
   <label style={label}>Ingresos mensuales documentables (ARS)<input style={input} type="number" min="0" required value={income} onChange={e=>setIncome(e.target.value)}/></label>
   <label style={label}>Situación laboral<select style={input} value={employment} onChange={e=>setEmployment(e.target.value)}><option value="salary_receipt">Relación de dependencia</option><option value="monotributo">Monotributista</option><option value="self_employed">Independiente</option><option value="other_formal">Otros ingresos formales</option><option value="none">Sin ingresos formales</option></select></label>
   <label style={label}><input type="checkbox" checked={hasCo} onChange={e=>setHasCo(e.target.checked)}/> Agregar ingresos de co-inquilino</label>
   {hasCo&&<label style={label}>Ingresos mensuales de co-inquilino (ARS)<input style={input} type="number" min="0" required value={coIncome} onChange={e=>setCoIncome(e.target.value)}/></label>}
   <label style={label}><input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)}/> Autorizo a VERLO a compartir los datos de esta solicitud con PowerMarket para analizar la caución. La evaluación definitiva y consulta crediticia requerirán las autorizaciones correspondientes.</label>
   {message&&<p role="alert" style={{color:"#a32222"}}>{message}</p>}
   <button disabled={busy} style={{background:"#050002",border:0,color:"white",padding:"13px 22px",borderRadius:12,cursor:"pointer"}}>{busy?"Enviando…":"Enviar solicitud"}</button>
  </form>}
 </section></main>
}
