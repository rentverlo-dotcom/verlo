// Read-only audit. Does not insert leads, generate matches, or send notifications.
// Run only against an explicitly configured QA Supabase project.
const url = process.env.QA_SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.QA_SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing QA Supabase configuration; refusing to run against production");
if (!process.env.QA_PROJECT_REF || !url.includes(process.env.QA_PROJECT_REF)) {
  throw new Error("QA project identity not confirmed; refusing to run");
}
const headers = { apikey:key, Authorization:`Bearer ${key}`, Accept:"application/json" };
async function rows(table, select, limit=1000) {
 const res=await fetch(`${url}/rest/v1/${table}?select=${encodeURIComponent(select)}&limit=${limit}`, {headers, signal:AbortSignal.timeout(15000)});
 if (!res.ok) throw Error(`${table}: HTTP ${res.status}: ${(await res.text()).slice(0,250)}`);
 return res.json();
}
const neighborhoods=await rows("lead_neighborhoods","lead_id,context,neighborhood_slug,province_id,municipality_id,locality_id,geo_key",1000);
const mismatches = neighborhoods.filter(r => {
 if (!r.geo_key) return false; // legacy records may lack georef: reported separately
 const expected = r.province_id==="02"
  ? `ar:02:caba:${String(r.geo_key).split(":").slice(3).join(":")}`
  : `ar:${r.province_id}:${r.municipality_id}:${r.locality_id}`;
 return !r.province_id || !r.municipality_id || !r.locality_id || expected!==r.geo_key;
});
const missing = neighborhoods.filter(r => !r.geo_key).length;
const matchRows=await rows("lead_matches","id,tenant_lead_id,owner_lead_id",1000);
const duplicates = matchRows.length - new Set(matchRows.map(r=>`${r.tenant_lead_id}:${r.owner_lead_id}`)).size;
const report={ checkedNeighborhoodRows:neighborhoods.length, withoutGeoref:missing, georefKeyMismatches:mismatches.length, checkedMatchRows:matchRows.length, duplicateMatchPairs:duplicates, limitPerTable:1000, note:"Read-only sample of the first 1000 rows; not full E2E verification"};
console.log(JSON.stringify(report,null,2));
if(mismatches.length || duplicates) process.exitCode=1;
