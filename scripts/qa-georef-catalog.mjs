import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("lib/seo/argentina-locations.ts", "utf8");
const places = [...source.matchAll(/"slug":\s*"([^"]+)"\s*,\s*"name":\s*"([^"]+)"\s*,\s*"province":\s*"([^"]+)"/g)].map((m) => ({slug:m[1], name:m[2], province:m[3]}));
if (places.length < 100) throw Error("Catalog extraction failed: " + places.length);
const normalize = (v) => v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
const provinces = {"Buenos Aires":"06","Ciudad Autónoma de Buenos Aires":"02","Catamarca":"10","Chaco":"22","Chubut":"26","Córdoba":"14","Corrientes":"18","Entre Ríos":"30","Formosa":"34","Jujuy":"38","La Pampa":"42","La Rioja":"46","Mendoza":"50","Misiones":"54","Neuquén":"58","Río Negro":"62","Salta":"66","San Juan":"70","San Luis":"74","Santa Cruz":"78","Santa Fe":"82","Santiago del Estero":"86","Tucumán":"90","Tierra del Fuego":"94"};
const expected = {"bariloche":["bariloche"],"cordoba":["cordoba"],"mar-del-plata":["general-pueyrredon"],"pinamar":["pinamar"],"tigre":["tigre"],"villa-gesell":["villa-gesell"],"vicente-lopez":["vicente-lopez"],"san-isidro":["san-isidro"],"nordelta":["tigre"],"carilo":["pinamar"],"la-plata":["la-plata"],"san-fernando":["san-fernando"],"pilar":["pilar"],"escobar":["escobar"],"bahia-blanca":["bahia-blanca"],"necochea":["necochea"]};
const officialNames = {"acassuso":"Acasusso","san-lorenzo-salta":"Villa San Lorenzo","yerba-buena":"Yerba Buena - Marcos Paz","barreal":"Barreal - Villa Pituil"};
const officialMunicipalities = {"san-bernardo":"la-costa"};
async function get(path, params) {const u = new URL("https://apis.datos.gob.ar/georef/api/"+path);for (const [k,v] of Object.entries(params))u.searchParams.set(k,String(v));for(let attempt=0;attempt<3;attempt++){try {const r=await fetch(u,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error("HTTP "+r.status);return await r.json();}catch(e){if(attempt===2)throw e;await new Promise(resolve=>setTimeout(resolve,800*(attempt+1)));}}}
async function check(p) {
 const provinceId = provinces[p.province]; if(!provinceId)return {...p,status:"FAIL",reason:"Province not mapped"};
 if(provinceId==="02")return {...p,status:"PASS",reason:"CABA client uses dedicated barrio list"};
 try {
  const data=await get("localidades",{nombre:officialNames[p.slug]||p.name,provincia:provinceId,max:100,campos:"id,nombre,municipio,departamento,provincia,centroide"});
  const exact=(data.localidades||[]).filter(i=>normalize(String(i.nombre||""))===normalize(officialNames[p.slug]||p.name)&&String(i.provincia?.id||provinceId)===provinceId&&(i.municipio?.id||i.departamento?.id)&&i.id);
  let matches=[...new Map(exact.map(i=>[String(i.municipio?.id||`dept:${i.departamento?.id}`)+":"+String(i.id),i])).values()];
  if(matches.length>1){const names=officialMunicipalities[p.slug]?[officialMunicipalities[p.slug]]:(expected[p.slug]||[normalize(p.name)]);const by=matches.filter(i=>names.includes(normalize(String(i.municipio?.nombre||i.departamento?.nombre||""))));if(by.length>0)matches=by;}
  if(matches.length>1){const mids=new Set(matches.map(i=>String(i.municipio?.id||`dept:${i.departamento?.id}`)));const len=Math.max(...matches.map(i=>String(i.id).length));const larger=matches.filter(i=>String(i.id).length===len);const shorter=matches.filter(i=>String(i.id).length<len);if(mids.size===1&&larger.length===1&&shorter.length>0&&shorter.every(i=>String(larger[0].id).startsWith(String(i.id))))matches=larger;}
  if(matches.length!==1) {
    const candidates=(data.localidades||[]).map(i=>({id:i.id,name:i.nombre,municipioId:i.municipio?.id||null,municipio:i.municipio?.nombre||null,provincia:i.provincia?.id||null}));
    console.log("DIAGNOSTIC",p.slug,JSON.stringify({returned:data.localidades?.length||0,candidates}));
    return {...p,status:"FAIL",reason:matches.length?"Ambiguous":"No exact match",candidates};
  }
  const item=matches[0], municipalityId=item.municipio?.id?String(item.municipio.id):`dept:${item.departamento.id}`, localityId=String(item.id);
  const [municipalities,localities]=await Promise.all([get(municipalityId.startsWith("dept:")?"departamentos":"municipios",{provincia:p.province,max:500}),get("localidades",{[municipalityId.startsWith("dept:")?"departamento":"municipio"]:municipalityId.replace(/^dept:/,""),max:500})]);
  const municipalityFound=(municipalityId.startsWith("dept:")?municipalities.departamentos:municipalities.municipios||[]).some(i=>(municipalityId.startsWith("dept:")?"dept:":"")+String(i.id)===municipalityId);
  const localityFound=(localities.localidades||[]).some(i=>String(i.id)===localityId);
  return {...p,status:municipalityFound&&localityFound?"PASS":"FAIL",reason:!municipalityFound?"Municipality missing in selector":!localityFound?"Locality ID missing in selector":"Both IDs present",provinceId,municipalityId,localityId,geoKey:`ar:${provinceId}:${municipalityId}:${localityId}`};
 }catch(e){return {...p,status:"ERROR",reason:String(e.message||e)};}
}
const results=[];let index=0;
async function worker(){while(index<places.length){const p=places[index++];const result=await check(p);results.push(result);console.log(result.status.padEnd(5),p.slug,result.reason);}}
await Promise.all(Array.from({length:3},worker));
results.sort((a,b)=>places.findIndex(p=>p.slug===a.slug)-places.findIndex(p=>p.slug===b.slug));

// For catalogue gaps, expose the official alternatives rather than guessing a locality ID.
async function probeMissing() {
 for (const [slug, provinceId] of [["nordelta","06"],["tolhuin","94"]]) {
   for (const category of ["localidades","localidades-censales","asentamientos","municipios","gobiernos-locales"]) {
     try {
       const result=await get(category,{nombre:slug,provincia:provinceId,max:100});
       const field=category.replace(/-/g,"_");
       const rows=Array.isArray(result[field])?result[field]:[];
       console.log("OFFICIAL_PROBE",slug,category,JSON.stringify(rows.map(x=>({id:x.id,nombre:x.nombre,municipio:x.municipio,departamento:x.departamento,provincia:x.provincia,localidad_censal:x.localidad_censal}))));
     } catch(e) {console.log("OFFICIAL_PROBE_ERROR",slug,category,String(e));}
   }
 }
}
await probeMissing();

const totals=Object.fromEntries(["PASS","FAIL","ERROR"].map(k=>[k,results.filter(x=>x.status===k).length]));
writeFileSync("georef-qa-report.json",JSON.stringify({date:new Date().toISOString(),totals,results},null,2));
console.log("TOTAL",JSON.stringify(totals));
if(totals.FAIL||totals.ERROR)process.exitCode=1;
