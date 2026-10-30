import { createHmac, timingSafeEqual } from "node:crypto"
function secret(){const v=process.env.CAUCION_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;if(!v)throw new Error("Missing signing secret");return v}
export function signCaucionLead(leadId:string){
 const expires=Date.now()+24*60*60*1000
 const payload=`${leadId}.${expires}`
 const signature=createHmac("sha256",secret()).update(payload).digest("hex")
 return `${payload}.${signature}`
}
export function verifyCaucionLead(token:string){
 const parts=token.split(".")
 if(parts.length!==3)return null
 const [leadId,expiresRaw,sig]=parts
 if(!/^[a-f0-9-]{36}$/i.test(leadId)||!/^[0-9]{13}$/.test(expiresRaw)||Number(expiresRaw)<Date.now()||! /^[a-f0-9]{64}$/.test(sig))return null
 const expected=createHmac("sha256",secret()).update(`${leadId}.${expiresRaw}`).digest()
 const actual=Buffer.from(sig,"hex")
 return timingSafeEqual(actual,expected)?leadId:null
}
