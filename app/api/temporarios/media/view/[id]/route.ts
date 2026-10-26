import {NextResponse} from "next/server"
import {createClient} from "@supabase/supabase-js"
import {getTemporaryStorageConfig} from "@/lib/temporarios/storage-config"
import {signTemporaryObject} from "@/lib/temporarios/r2-signer"
export const runtime="nodejs"
export const dynamic="force-dynamic"
export async function GET(request:Request,{params}:{params:{id:string}}){
  if(process.env.VERCEL_ENV!=="preview"||process.env.VERCEL_GIT_COMMIT_REF!=="feature/temporarios")return new Response(null,{status:404})
  const auth=request.headers.get("authorization")||""
  if(!auth.startsWith("Bearer ")||auth.length>4096)return new Response(null,{status:401})
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY
  const config=getTemporaryStorageConfig(process.env)
  if(!url||!anon||!service||!config)return new Response(null,{status:503})
  const client=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data:{user},error}=await client.auth.getUser(auth.slice(7))
  if(error||!user?.id||!user.email_confirmed_at)return new Response(null,{status:401})
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}})
  const media=await db.from("temporary_property_media").select("id,property_id,object_key,mime_type").eq("id",params.id).maybeSingle()
  if(media.error||!media.data)return new Response(null,{status:404})
  const property=await db.from("temporary_properties").select("owner_user_id,status").eq("id",media.data.property_id).maybeSingle()
  if(property.error||!property.data)return new Response(null,{status:404})
  let authorized=property.data.owner_user_id===user.id
  if(!authorized){
    const matches=await db.from("temporary_matches").select("id,temporary_demands!inner(tenant_user_id)").eq("property_id",media.data.property_id).eq("temporary_demands.tenant_user_id",user.id).limit(1)
    authorized=!matches.error&&Boolean(matches.data?.length)
  }
  if(!authorized)return new Response(null,{status:403})
  const signed=signTemporaryObject(config,"GET",media.data.object_key)
  try{
    const received=await fetch(signed.url,{cache:"no-store"})
    if(!received.ok)return new Response(null,{status:502})
    const bytes=await received.arrayBuffer()
    return new Response(bytes,{status:200,headers:{"Content-Type":media.data.mime_type,"Cache-Control":"private, max-age=120","X-Content-Type-Options":"nosniff"}})
  }catch{return new Response(null,{status:502})}
}
