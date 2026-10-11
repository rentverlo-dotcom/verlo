"use client"
import {useEffect,useState} from "react"
import {supabase} from "@/lib/supabase/client"

type Photo={id:string;mime_type:string}
type Loaded={id:string;url:string}

export default function PropertyGallery({photos}:{photos:Photo[]}){
 const [images,setImages]=useState<Loaded[]>([])
 const [active,setActive]=useState<number|null>(null)
 const [loading,setLoading]=useState(false)
 const photoIds=photos.filter(p=>p.mime_type.startsWith("image/")).map(p=>p.id).join(",")

 useEffect(()=>{
  let mounted=true
  const urls:string[]=[]
  setImages([])
  setActive(null)
  const ids=photoIds?photoIds.split(","):[]
  if(!ids.length){setLoading(false);return}
  setLoading(true)
  async function load(){
   try{
    const {data:{session}}=await supabase.auth.getSession()
    if(!session?.access_token)return
    const found=await Promise.all(ids.map(async id=>{
     try{
      const r=await fetch("/api/temporarios/media/view/"+encodeURIComponent(id),{
       headers:{Authorization:"Bearer "+session.access_token},cache:"no-store"
      })
      if(!r.ok)return null
      const url=URL.createObjectURL(await r.blob())
      urls.push(url)
      return {id,url}
     }catch{return null}
    }))
    if(mounted)setImages(found.filter((x):x is Loaded=>x!==null))
   }finally{if(mounted)setLoading(false)}
  }
  void load()
  return ()=>{mounted=false;urls.forEach(url=>URL.revokeObjectURL(url))}
 },[photoIds])

 useEffect(()=>{
  if(active===null)return
  const previous=document.body.style.overflow
  document.body.style.overflow="hidden"
  const key=(event:KeyboardEvent)=>{
   if(event.key==="Escape")setActive(null)
   if(event.key==="ArrowRight")setActive(x=>x===null?null:(x+1)%images.length)
   if(event.key==="ArrowLeft")setActive(x=>x===null?null:(x-1+images.length)%images.length)
  }
  window.addEventListener("keydown",key)
  return ()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",key)}
 },[active,images.length])

 const navStyle={border:0,borderRadius:99,background:"#fff",color:"#050002",width:44,height:44,fontSize:26,fontWeight:700,cursor:"pointer"} as const
 if(!images.length)return <div style={{height:160,background:"#f5edef",borderRadius:16,display:"grid",placeItems:"center",color:"#6f6267"}}>{loading?"Cargando fotografías...":photoIds?"No se pudieron cargar las fotografías":"Todavía no hay fotos"}</div>
 return <div>
  <button type="button" onClick={()=>setActive(0)} aria-label="Abrir galería de fotografías" style={{display:"block",position:"relative",width:"100%",padding:0,border:0,background:"transparent",cursor:"zoom-in"}}>
   <img src={images[0].url} alt="Fotografía principal del alojamiento" style={{display:"block",width:"100%",height:260,objectFit:"cover",borderRadius:16}}/>
   <span style={{position:"absolute",right:12,bottom:12,color:"#fff",background:"rgba(5,0,2,.77)",borderRadius:22,padding:"7px 13px",fontSize:13,fontWeight:800}}>Ver fotos · {images.length}</span>
  </button>
  {active!==null&&<div role="dialog" aria-modal="true" aria-label="Galería del alojamiento" onClick={()=>setActive(null)} style={{position:"fixed",inset:0,zIndex:99999,background:"rgba(5,0,2,.95)",display:"flex",alignItems:"center",justifyContent:"center",padding:18}}>
   <button type="button" aria-label="Cerrar galería" onClick={()=>setActive(null)} style={{...navStyle,position:"absolute",right:20,top:20,zIndex:2}}>×</button>
   <div onClick={event=>event.stopPropagation()} style={{width:"100%",maxWidth:1100,display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
    {images.length>1&&<button type="button" aria-label="Fotografía anterior" style={navStyle} onClick={()=>setActive(x=>x===null?null:(x-1+images.length)%images.length)}>‹</button>}
    <img src={images[active].url} alt={"Fotografía "+(active+1)+" de "+images.length} style={{maxWidth:"calc(100% - 110px)",maxHeight:"82vh",objectFit:"contain",borderRadius:10}}/>
    {images.length>1&&<button type="button" aria-label="Fotografía siguiente" style={navStyle} onClick={()=>setActive(x=>x===null?null:(x+1)%images.length)}>›</button>}
   </div>
   <div style={{position:"absolute",bottom:18,color:"#fff",fontWeight:800,fontSize:15}}>{active+1} / {images.length}</div>
  </div>}
 </div>
}
