"use client"
import {useEffect,useState} from "react"
import {supabase} from "@/lib/supabase/client"
type Photo={id:string;mime_type:string}
export default function PropertyGallery({photos}:{photos:Photo[]}){
 const [src,setSrc]=useState("")
 useEffect(()=>{
   let active=true
   let objectUrl=""
   async function load(){
     const photo=photos.find(p=>p.mime_type.startsWith("image/"))
     if(!photo)return
     const {data:{session}}=await supabase.auth.getSession()
     if(!session)return
     const response=await fetch("/api/temporarios/media/view/"+photo.id,{headers:{Authorization:"Bearer "+session.access_token}})
     if(!response.ok)return
     objectUrl=URL.createObjectURL(await response.blob())
     if(active)setSrc(objectUrl)
   }
   void load()
   return ()=>{active=false;if(objectUrl)URL.revokeObjectURL(objectUrl)}
 },[photos.map(p=>p.id).join(",")])
 return src?<img src={src} alt="Foto del alojamiento" style={{width:"100%",height:260,objectFit:"cover",borderRadius:16}}/>:<div style={{height:160,background:"#f5edef",borderRadius:16,display:"grid",placeItems:"center",color:"#6f6267"}}>{photos.length?"Cargando fotos...":"Todavía no hay fotos"}</div>
}
