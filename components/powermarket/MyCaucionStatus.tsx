"use client"
import {useEffect,useState} from "react"
import {supabase} from "@/lib/supabase/client"
type Item={id:string;status:string;requested_rent_ars:number;estimated_expenses_ars:number;approved_max_total_ars:number|null;decision_expires_at:string|null;created_at:string}
const labels:Record<string,string>={submitted:"Solicitud recibida",under_review:"En evaluación",more_info_required:"Documentación pendiente",prequalified:"Precalificada",not_eligible:"No precalificada",alternative_offered:"Oferta de monto alternativo",expired:"Vencida",withdrawn:"Retirada"}
const money=(n:number)=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(n)
export default function MyCaucionStatus(){
 const [items,setItems]=useState<Item[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("")
 useEffect(()=>{let active=true;(async()=>{const {data}=await supabase.auth.getSession();if(!data.session){if(active)setLoading(false);return}
 const res=await fetch("/api/powermarket/my-status",{headers:{Authorization:`Bearer ${data.session.access_token}`},cache:"no-store"})
 const body=await res.json().catch(()=>({}));if(!active)return;if(!res.ok)setError(body.error||"No disponible");else setItems(body.applications||[]);setLoading(false)})();return()=>{active=false}},[])
 if(loading||(!items.length&&!error))return null
 return <section style={{background:"#fff",border:"1px solid rgba(5,0,2,.10)",borderRadius:22,padding:22,margin:"20px 0",color:"#050002"}}>
 <h2 style={{fontSize:24,margin:"0 0 12px"}}>Mi caución</h2>
 {error?<p>{error}</p>:items.map(item=><div key={item.id} style={{padding:"12px 0",borderTop:"1px solid #eee6e8"}}>
 <strong>{labels[item.status]||item.status}</strong>
 <p style={{margin:"6px 0"}}>Importe solicitado: {money(Number(item.requested_rent_ars)+Number(item.estimated_expenses_ars))} mensuales (alquiler + expensas).</p>
 {item.approved_max_total_ars!=null&&<p style={{margin:"6px 0"}}>Límite de caución precalificado: {money(Number(item.approved_max_total_ars))}</p>}
 {item.decision_expires_at&&<p style={{margin:"6px 0"}}>Vigencia: {new Date(item.decision_expires_at).toLocaleDateString("es-AR")}</p>}
 </div>)}</section>
}
