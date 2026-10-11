"use client"
import {useState,type ChangeEvent} from "react"
import {supabase} from "@/lib/supabase/client"
import {validateTemporaryMedia} from "@/lib/temporarios/media-validation"
export default function PropertyPhotoUpload({propertyId,onUploaded}:{propertyId:string;onUploaded:()=>void}){
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState("")
 async function upload(event:ChangeEvent<HTMLInputElement>){
   const files=Array.from(event.target.files||[])
   if(!files.length)return
   const checked=validateTemporaryMedia(files)
   if("message" in checked){setNotice(checked.message);return}
   setBusy(true);setNotice("Subiendo fotografías...")
   try{
     const {data:{session}}=await supabase.auth.getSession()
     if(!session?.access_token)throw Error("Ingresá a VERLO para continuar")
     for(const file of files){
       const headers={"Content-Type":"application/json",Authorization:"Bearer "+session.access_token}
       const presign=await fetch("/api/temporarios/media/presign",{method:"POST",headers,body:JSON.stringify({propertyId,mimeType:file.type,bytes:file.size})})
       const a:{ok?:boolean;uploadUrl?:string;objectKey?:string;error?:string}=await presign.json()
       if(!presign.ok||!a.uploadUrl||!a.objectKey)throw Error(a.error||"No se pudo preparar la subida")
       const put=await fetch(a.uploadUrl,{method:"PUT",headers:{"Content-Type":file.type},body:file})
       if(!put.ok)throw Error("R2 rechazó la subida. Revisá CORS del bucket de Temporarios.")
       const finish=await fetch("/api/temporarios/media/complete",{method:"POST",headers,body:JSON.stringify({propertyId,objectKey:a.objectKey,mimeType:file.type,bytes:file.size})})
       const b:{ok?:boolean;error?:string}=await finish.json()
       if(!finish.ok||!b.ok)throw Error(b.error||"No se pudo guardar la fotografía")
     }
     setNotice("Fotos guardadas correctamente")
     event.target.value=""
     onUploaded()
   }catch(error){setNotice(error instanceof Error?error.message:"Error de conexión")}
   finally{setBusy(false)}
 }
 return <div style={{marginTop:12}}>
   <label style={{display:"inline-flex",padding:"12px 20px",background:"#050002",color:"white",borderRadius:30,cursor:busy?"wait":"pointer",fontWeight:850}}>
     {busy?"Subiendo...":"Agregar fotos"}
     <input type="file" accept=".jpg,.jpeg,.png,.webp,.mp4" multiple onChange={event=>void upload(event)} disabled={busy} style={{display:"none"}}/>
   </label>
   {notice&&<p role="status" style={{fontSize:13,color:"#695c63"}}>{notice}</p>}
 </div>
}
