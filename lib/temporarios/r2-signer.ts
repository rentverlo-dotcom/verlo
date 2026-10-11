import { createHash, createHmac } from "node:crypto"
import type { TemporaryStorageConfig } from "./storage-config"

const encode = (s:string) => encodeURIComponent(s).replace(/[!'()*]/g,c=>"%"+c.charCodeAt(0).toString(16).toUpperCase())
const hmac=(key:Buffer|string,value:string)=>createHmac("sha256",key).update(value).digest()
const sha=(value:string)=>createHash("sha256").update(value).digest("hex")

export function signTemporaryObject(config:TemporaryStorageConfig, method:"PUT"|"HEAD", key:string, mime?:string) {
  const host=config.accountId+".r2.cloudflarestorage.com"
  const path="/"+encode(config.bucket)+"/"+key.split("/").map(encode).join("/")
  const now=new Date()
  const stamp=now.toISOString().replace(/[:-]|\.\d{3}/g,"")
  const day=stamp.slice(0,8)
  const scope=day+"/auto/s3/aws4_request"
  const query="X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential="+encode(config.accessKeyId+"/"+scope)+
    "&X-Amz-Date="+stamp+"&X-Amz-Expires=120&X-Amz-SignedHeaders=host"
  const canonical=[method,path,query,"host:"+host+"\n","host","UNSIGNED-PAYLOAD"].join("\n")
  const stringToSign=["AWS4-HMAC-SHA256",stamp,scope,sha(canonical)].join("\n")
  const signingKey=hmac(hmac(hmac(hmac("AWS4"+config.secretAccessKey,day),"auto"),"s3"),"aws4_request")
  const signature=createHmac("sha256",signingKey).update(stringToSign).digest("hex")
  return {url:"https://"+host+path+"?"+query+"&X-Amz-Signature="+signature,mime}
}
