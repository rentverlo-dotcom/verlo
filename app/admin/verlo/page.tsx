"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import VerloBrand from "@/components/VerloBrand"

type Mode = "production" | "e2e" | "all"

type Data = {
  ok: true
  generated_at: string
  summary: {
    leads: number
    matches: number
    notifications: number
    push_sent: number
    push_failed: number
    push_active: number
    contracts: number
    rentals: number
  }
  funnel: {
    matches: number
    tenant_interest: number
    tenant_verified: number
    owner_interest: number
    ready: number
    post_visit_double_ok: number
  }
  leads: any[]
  matches: any[]
  notifications: any[]
}

function dt(v?: string | null) {
  if (!v) return "—"
  return new Date(v).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

export default function AdminVerloPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("production")
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session

      if (!session) {
        router.replace("/login?next=%2Fadmin%2Fverlo")
        return
      }

      const res = await fetch(`/api/admin/dashboard?mode=${mode}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      })

      const json = await res.json()

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "No pudimos cargar el dashboard")
      }

      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [mode, router])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="root">
      <style>{`
        *{box-sizing:border-box}
        body{margin:0;background:#f3eeee;color:#050002;font-family:Inter,system-ui,sans-serif}
        .root{min-height:100vh;background:radial-gradient(circle at 8% 0%,rgba(242,168,169,.32),transparent 28%),#f3eeee}
        .wrap{width:min(1400px,calc(100% - 32px));margin:auto}
        header{position:sticky;top:0;z-index:20;background:rgba(243,238,238,.9);backdrop-filter:blur(18px);border-bottom:1px solid rgba(5,0,2,.08)}
        .nav{min-height:72px;display:flex;align-items:center;justify-content:space-between;gap:14px}
        .actions{display:flex;gap:8px;flex-wrap:wrap}
        button{min-height:38px;padding:0 14px;border-radius:999px;border:1px solid rgba(5,0,2,.12);background:white;font-weight:900;cursor:pointer}
        button.active{background:#050002;color:white}
        main{padding:44px 0 90px}
        h1{margin:0;font-size:clamp(46px,7vw,88px);line-height:.9;letter-spacing:-.075em}
        h1 em{font-family:Georgia,serif;font-weight:400}
        .sub{margin:16px 0 0;color:rgba(5,0,2,.58);font-weight:650}
        .cards{margin-top:30px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
        .metric,.panel{background:rgba(255,255,255,.78);border:1px solid rgba(5,0,2,.08);box-shadow:0 18px 50px rgba(5,0,2,.05)}
        .metric{padding:22px;border-radius:24px;min-width:0}
        .metric strong{display:block;font-size:38px;letter-spacing:-.06em}
        .metric span{display:block;margin-top:8px;font-size:11px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;color:rgba(5,0,2,.48)}
        .panel{margin-top:28px;padding:24px;border-radius:28px}
        .panel h2{margin:0 0 18px;font-size:28px;letter-spacing:-.04em}
        .funnel{display:grid;gap:10px}
        .frow{display:grid;grid-template-columns:190px 1fr 60px;gap:12px;align-items:center}
        .track{height:14px;border-radius:999px;background:rgba(5,0,2,.08);overflow:hidden}
        .fill{height:100%;background:#050002;border-radius:inherit}
        .table{overflow-x:auto}
        table{width:100%;border-collapse:collapse;min-width:900px}
        th,td{padding:12px 10px;border-bottom:1px solid rgba(5,0,2,.08);text-align:left;font-size:13px;vertical-align:top}
        th{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(5,0,2,.48)}
        .pill{display:inline-flex;padding:5px 9px;border-radius:999px;background:rgba(5,0,2,.08);font-size:10px;font-weight:950;text-transform:uppercase}
        .pill.sent{background:rgba(40,150,80,.14)}
        .pill.failed{background:rgba(190,50,50,.14)}
        .muted{color:rgba(5,0,2,.46);font-size:12px}
        .err{margin-top:20px;padding:16px;border-radius:18px;background:rgba(190,50,50,.1)}
        @media(max-width:900px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}.frow{grid-template-columns:130px 1fr 50px}}
      `}</style>

      <header>
        <div className="wrap nav">
          <VerloBrand />
          <div className="actions">
            {(["production","e2e","all"] as Mode[]).map(v => (
              <button key={v} className={mode===v?"active":""} onClick={()=>setMode(v)}>
                {v==="production"?"PRODUCCIÓN":v==="e2e"?"E2E":"TODO"}
              </button>
            ))}
            <button onClick={load}>ACTUALIZAR</button>
          </div>
        </div>
      </header>

      <main>
        <div className="wrap">
          <h1>Control<br/><em>Verlo.</em></h1>
          <p className="sub">Estado operativo del MVP.</p>

          {loading && <div className="panel">Cargando métricas...</div>}
          {error && <div className="err">{error}</div>}

          {data && (
            <>
              <section className="cards">
                <Metric n={data.summary.leads} label="Usuarios / formularios" />
                <Metric n={data.summary.matches} label="Matches" />
                <Metric n={data.summary.push_sent} label="Push entregadas" />
                <Metric n={data.summary.push_failed} label="Push fallidas" />
                <Metric n={data.summary.push_active} label="Push activas" />
                <Metric n={data.summary.contracts} label="Contratos" />
                <Metric n={data.summary.rentals} label="Alquileres" />
                <Metric n={data.summary.notifications} label="Eventos" />
              </section>

              <section className="panel">
                <h2>Funnel MVP</h2>
                <div className="funnel">
                  <F label="Matches" n={data.funnel.matches} max={data.funnel.matches} />
                  <F label="Interés inquilino" n={data.funnel.tenant_interest} max={data.funnel.matches} />
                  <F label="Inquilino validado" n={data.funnel.tenant_verified} max={data.funnel.matches} />
                  <F label="Interés propietario" n={data.funnel.owner_interest} max={data.funnel.matches} />
                  <F label="Doble OK" n={data.funnel.ready} max={data.funnel.matches} />
                  <F label="Doble OK post-visita" n={data.funnel.post_visit_double_ok} max={data.funnel.matches} />
                </div>
              </section>

              <section className="panel">
                <h2>Matches recientes</h2>
                <div className="table"><table>
                  <thead><tr><th>Inquilino</th><th>Propietario</th><th>Score</th><th>Estado</th><th>Interés I</th><th>Validado</th><th>Interés P</th><th>Doble OK</th><th>Fecha</th></tr></thead>
                  <tbody>{data.matches.map(m => <tr key={m.id}>
                    <td>{m.tenant?.full_name||"—"}<div className="muted">{m.tenant?.email||""}</div></td>
                    <td>{m.owner?.full_name||"—"}<div className="muted">{m.owner?.email||""}</div></td>
                    <td>{m.score}%</td>
                    <td><span className="pill">{m.status}</span></td>
                    <td>{m.tenant_interest_at?"✓":"—"}</td>
                    <td>{m.tenant_verified_at?"✓":"—"}</td>
                    <td>{m.owner_interest_at?"✓":"—"}</td>
                    <td>{m.ready_to_connect_at?"✓":"—"}</td>
                    <td>{dt(m.created_at)}</td>
                  </tr>)}</tbody>
                </table></div>
              </section>

              <section className="panel">
                <h2>Notificaciones recientes</h2>
                <div className="table"><table>
                  <thead><tr><th>Usuario</th><th>Evento</th><th>Push</th><th>URL</th><th>Error</th><th>Hora</th></tr></thead>
                  <tbody>{data.notifications.map(n => <tr key={n.id}>
                    <td>{n.lead?.full_name||"—"}<div className="muted">{n.lead?.email||""}</div></td>
                    <td>{n.event_type}</td>
                    <td><span className={`pill ${n.status}`}>{n.status}</span></td>
                    <td>{n.url||"—"}</td>
                    <td>{n.last_error||"—"}</td>
                    <td>{dt(n.sent_at||n.updated_at)}</td>
                  </tr>)}</tbody>
                </table></div>
              </section>

              <section className="panel">
                <h2>Últimos usuarios</h2>
                <div className="table"><table>
                  <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Intención</th><th>Zona</th><th>Tipo</th><th>Alta</th></tr></thead>
                  <tbody>{data.leads.map(l => <tr key={l.id}>
                    <td>{l.full_name}</td><td>{l.email}</td><td>{l.role}</td><td>{l.intent}</td><td>{l.neighborhood_slug||l.zone||"—"}</td><td>{l.property_type||l.desired_property_type||"—"}</td><td>{dt(l.created_at)}</td>
                  </tr>)}</tbody>
                </table></div>
              </section>

              <p className="sub">Actualizado: {dt(data.generated_at)}</p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function Metric({n,label}:{n:number,label:string}) {
  return <div className="metric"><strong>{n}</strong><span>{label}</span></div>
}

function F({label,n,max}:{label:string,n:number,max:number}) {
  const width = max ? Math.max(n>0?3:0, Math.round((n/max)*100)) : 0
  return <div className="frow"><strong>{label}</strong><div className="track"><div className="fill" style={{width:`${width}%`}} /></div><b>{n}</b></div>
}
