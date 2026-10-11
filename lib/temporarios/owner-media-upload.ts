"use client"
import {supabase} from "@/lib/supabase/client"
import {validateTemporaryMedia} from "@/lib/temporarios/media-validation"

const DB_NAME="verlo-temporarios-owner-media-v1"
const STORE="pending"
const KEY="owner-files"

export function checkOwnerFiles(files:File[]){
 const result=validateTemporaryMedia(files)
 if("message" in result)throw Error(result.message)
}
export function rememberOwnerFiles(files:File[]):Promise<void>{
 return new Promise((resolve,reject)=>{
  if(!files.length){resolve();return}
  const open=indexedDB.open(DB_NAME,1)
  open.onupgradeneeded=()=>{if(!open.result.objectStoreNames.contains(STORE))open.result.createObjectStore(STORE)}
  open.onerror=()=>reject(Error("No pudimos conservar las fotos en este dispositivo"))
  open.onsuccess=()=>{
   const db=open.result
   const tx=db.transaction(STORE,"readwrite")
   tx.objectStore(STORE).put(files,KEY)
   tx.oncomplete=()=>{db.close();resolve()}
   tx.onerror=()=>{db.close();reject(Error("Sin espacio para conservar las fotos. Intentá con menos imágenes."))}
  }
 })
}
export function takeOwnerFiles():Promise<File[]>{
 return new Promise((resolve,reject)=>{
  const open=indexedDB.open(DB_NAME,1)
  open.onupgradeneeded=()=>{if(!open.result.objectStoreNames.contains(STORE))open.result.createObjectStore(STORE)}
  open.onerror=()=>reject(Error("No se pudieron recuperar las fotografías"))
  open.onsuccess=()=>{
   const db=open.result
   const tx=db.transaction(STORE,"readonly")
   const req=tx.objectStore(STORE).get(KEY)
   req.onsuccess=()=>resolve(Array.isArray(req.result)?req.result:[])
   req.onerror=()=>reject(Error("No se pudieron recuperar las fotografías"))
   tx.oncomplete=()=>db.close()
  }
 })
}
export function clearOwnerFiles():Promise<void>{
 return new Promise(resolve=>{
  const open=indexedDB.open(DB_NAME,1)
  open.onerror=()=>resolve()
  open.onsuccess=()=>{
   const db=open.result
   if(!db.objectStoreNames.contains(STORE)){db.close();resolve();return}
   const tx=db.transaction(STORE,"readwrite")
   tx.objectStore(STORE).delete(KEY)
   tx.oncomplete=()=>{db.close();resolve()}
   tx.onerror=()=>{db.close();resolve()}
  }
 })
}
export async function uploadOwnerFiles(propertyId:string,files:File[],onProgress?:(message:string)=>void){
 checkOwnerFiles(files)
 if(!files.length)return
 const {data:{session}}=await supabase.auth.getSession()
 if(!session?.access_token)throw Error("Iniciá sesión para subir fotografías")
 for(let i=0;i<files.length;i++){
  const file=files[i]
  onProgress?.("Subiendo foto "+(i+1)+" de "+files.length+"...")
  const headers={"Content-Type":"application/json",Authorization:"Bearer "+session.access_token}
  const presign=await fetch("/api/temporarios/media/presign",{method:"POST",headers,body:JSON.stringify({propertyId,mimeType:file.type,bytes:file.size})})
  const a:{ok?:boolean;uploadUrl?:string;objectKey?:string;error?:string}=await presign.json()
  if(!presign.ok||!a.uploadUrl||!a.objectKey)throw Error(a.error||"No se pudo preparar la subida")
  const put=await fetch(a.uploadUrl,{method:"PUT",headers:{"Content-Type":file.type},body:file})
  if(!put.ok)throw Error("No pudimos subir una fotografía. Podés reintentar desde Mis temporarios.")
  const finish=await fetch("/api/temporarios/media/complete",{method:"POST",headers,body:JSON.stringify({propertyId,objectKey:a.objectKey,mimeType:file.type,bytes:file.size})})
  const b:{ok?:boolean;error?:string}=await finish.json()
  if(!finish.ok||!b.ok)throw Error(b.error||"La foto se subió, pero no se pudo asociar a la propiedad")
 }
}
