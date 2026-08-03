import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

type SearchParams = Promise<{ token?: string }>

type LeadSummary = {
  total_leads: number
  owners: number
  tenants: number
  renewals: number
  hot_leads: number
  leads_7d: number
  leads_30d: number
}

async function getSupabaseData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return { summary: null, byDay: [], byZone: [], byCampaign: [], recent: [] }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const [summaryRes, byDayRes, byZoneRes, byCampaignRes, recentRes] = await Promise.all([
    supabase.from("investor_lead_summary").select("*").single(),
    supabase.from("investor_leads_by_day").select("*").limit(14),
    supabase.from("investor_leads_by_zone").select("*").limit(10),
    supabase.from("investor_leads_by_campaign").select("*").limit(10),
    supabase.from("investor_recent_leads").select("*").limit(20),
    supabase.from("investor_leads_by_role").select("*").limit(20),
supabase.from("investor_leads_by_role_neighborhood").select("*").limit(80),
supabase.from("investor_tenant_demand_by_neighborhood_rooms").select("*").limit(80),
supabase.from("investor_matches_by_neighborhood").select("*").limit(40),
  ])

  return {
    summary: summaryRes.data as LeadSummary | null,
    byDay: byDayRes.data || [],
    byZone: byZoneRes.data || [],
    byCampaign: byCampaignRes.data || [],
    recent: recentRes.data || [],
    byRole: byRoleRes.data || [],
byRoleNeighborhood: byRoleNeighborhoodRes.data || [],
tenantDemandRooms: tenantDemandRoomsRes.data || [],
matchesByNeighborhood: matchesByNeighborhoodRes.data || [],
  }
}

async function getMetaData() {
  const adAccountId = process.env.META_AD_ACCOUNT_ID
  const token = process.env.META_MARKETING_ACCESS_TOKEN
  const graphVersion = process.env.META_GRAPH_VERSION || "v21.0"

  if (!adAccountId || !token) {
    return { ok: false, spend: 0, impressions: 0, clicks: 0, rows: [] as any[] }
  }

  const fields = [
    "campaign_name",
    "spend",
    "impressions",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "actions",
    "cost_per_action_type",
  ].join(",")

  const url =
    `https://graph.facebook.com/${graphVersion}/${adAccountId}/insights` +
    `?level=campaign` +
    `&date_preset=last_30d` +
    `&fields=${encodeURIComponent(fields)}` +
    `&access_token=${encodeURIComponent(token)}`

  try {
    const res = await fetch(url, { cache: "no-store" })
    const json = await res.json()

    const rows = Array.isArray(json.data) ? json.data : []

    const spend = rows.reduce((sum: number, row: any) => sum + Number(row.spend || 0), 0)
    const impressions = rows.reduce((sum: number, row: any) => sum + Number(row.impressions || 0), 0)
    const clicks = rows.reduce((sum: number, row: any) => sum + Number(row.clicks || 0), 0)

    return { ok: true, spend, impressions, clicks, rows }
  } catch {
    return { ok: false, spend: 0, impressions: 0, clicks: 0, rows: [] as any[] }
  }
}

function money(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function InvestorPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const requiredToken = process.env.INVESTOR_DASHBOARD_TOKEN

  if (requiredToken && params.token !== requiredToken) {
    return (
      <main style={page}>
        <section style={locked}>
          <h1>Acceso privado</h1>
          <p>Falta token de inversor.</p>
        </section>
      </main>
    )
  }

  const [supabaseData, metaData] = await Promise.all([getSupabaseData(), getMetaData()])

  const summary = supabaseData.summary
  const totalLeads = summary?.total_leads || 0
  const cpl = totalLeads > 0 ? metaData.spend / totalLeads : 0

  return (
    <main style={page}>
      <section style={shell}>
        <header style={header}>
          <div>
            <p style={eyebrow}>Verlo / Investor dashboard</p>
            <h1 style={title}>Demanda real + gasto publicitario</h1>
            <p style={subtitle}>
              Lectura simple del funnel: inversión en Meta, leads en Supabase, segmentación y potencial.
            </p>
          </div>
          <a href="/" style={homeLink}>Volver</a>
        </header>

        <section style={grid4}>
          <Metric label="Leads totales" value={totalLeads} />
          <Metric label="Propietarios" value={summary?.owners || 0} />
          <Metric label="Inquilinos" value={summary?.tenants || 0} />
          <Metric label="Renovaciones" value={summary?.renewals || 0} />
        </section>

        <section style={grid4}>
          <Metric label="Gasto Meta 30d" value={metaData.ok ? money(metaData.spend) : "Sin conectar"} />
          <Metric label="CPL estimado" value={metaData.ok ? money(cpl) : "Sin conectar"} />
          <Metric label="Clicks Meta 30d" value={metaData.clicks} />
          <Metric label="Impresiones 30d" value={metaData.impressions} />
        </section>

        <section style={grid2}>
          <Panel title="Leads por día">
            <Table
              rows={supabaseData.byDay}
              columns={[
                ["day", "Día"],
                ["leads", "Leads"],
                ["owners", "Dueños"],
                ["tenants", "Inq."],
                ["renewals", "Renov."],
              ]}
            />
          </Panel>

          <Panel title="Zonas principales">
            <Table rows={supabaseData.byZone} columns={[["zone", "Zona"], ["leads", "Leads"]]} />
          </Panel>
        </section>

        <section style={grid2}>
          <Panel title="Leads por campaña">
            <Table
              rows={supabaseData.byCampaign}
              columns={[
                ["campaign", "Campaña"],
                ["leads", "Leads"],
                ["owners", "Dueños"],
                ["renewals", "Renov."],
              ]}
            />
          </Panel>

          <Panel title="Meta campañas 30d">
            <Table
              rows={metaData.rows}
              columns={[
                ["campaign_name", "Campaña"],
                ["spend", "Gasto"],
                ["clicks", "Clicks"],
                ["ctr", "CTR"],
              ]}
            />
          </Panel>
        </section>

        <Panel title="Últimos leads anonimizados">
          <Table
            rows={supabaseData.recent}
            columns={[
              ["created_at", "Fecha"],
              ["role", "Rol"],
              ["intent", "Intención"],
              ["zone", "Zona"],
              ["lead_quality", "Calidad"],
              ["utm_campaign", "Campaña"],
            ]}
          />
        </Panel>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={metric}>
      <strong style={metricValue}>{value}</strong>
      <span style={metricLabel}>{label}</span>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={panel}>
      <h2 style={panelTitle}>{title}</h2>
      {children}
    </section>
  )
}

function Table({
  rows,
  columns,
}: {
  rows: any[]
  columns: [string, string][]
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={table}>
        <thead>
          <tr>
            {columns.map(([key, label]) => (
              <th key={key} style={th}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td style={td} colSpan={columns.length}>Sin datos todavía</td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index}>
                {columns.map(([key]) => (
                  <td key={key} style={td}>{formatCell(row[key])}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function formatCell(value: any) {
  if (value === null || value === undefined || value === "") return "—"
  if (typeof value === "number") return value.toLocaleString("es-AR")
  if (typeof value === "string" && value.includes("T")) return value.slice(0, 10)
  return String(value)
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 82% 16%, rgba(242,168,169,.38), transparent 30%), #f2ebec",
  color: "#050002",
  fontFamily: "Inter, system-ui, sans-serif",
}

const shell: React.CSSProperties = {
  width: "min(1180px, calc(100% - 32px))",
  margin: "0 auto",
  padding: "42px 0 72px",
}

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 24,
  alignItems: "flex-start",
  marginBottom: 34,
  padding: 32,
  borderRadius: 36,
  background: "rgba(255,255,255,.72)",
  border: "1px solid rgba(5,0,2,.08)",
  boxShadow: "0 22px 70px rgba(5,0,2,.07)",
}

const eyebrow: React.CSSProperties = {
  margin: 0,
  color: "#c37986",
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: ".14em",
  textTransform: "uppercase",
}

const title: React.CSSProperties = {
  margin: "12px 0 0",
  maxWidth: 880,
  fontSize: "clamp(42px, 5.2vw, 72px)",
  lineHeight: .92,
  letterSpacing: "-.075em",
  fontWeight: 950,
}

const subtitle: React.CSSProperties = {
  margin: "18px 0 0",
  maxWidth: 760,
  color: "rgba(5,0,2,.62)",
  fontSize: 18,
  lineHeight: 1.5,
}

const homeLink: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 999,
  background: "#050002",
  color: "white",
  textDecoration: "none",
  fontWeight: 950,
}

const grid4: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 16,
  marginBottom: 16,
}

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
  marginBottom: 14,
}

const metric: React.CSSProperties = {
  minHeight: 132,
  padding: 24,
  borderRadius: 30,
  background: "rgba(255,255,255,.78)",
  border: "1px solid rgba(5,0,2,.08)",
  boxShadow: "0 18px 50px rgba(5,0,2,.06)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
}

const panel: React.CSSProperties = {
  padding: 22,
  borderRadius: 28,
  background: "rgba(255,255,255,.72)",
  border: "1px solid rgba(5,0,2,.08)",
  boxShadow: "0 18px 50px rgba(5,0,2,.06)",
  marginBottom: 14,
}

const panelTitle: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: 22,
  letterSpacing: "-.045em",
}

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 8px",
  borderBottom: "1px solid rgba(5,0,2,.12)",
  color: "rgba(5,0,2,.52)",
  fontWeight: 950,
}

const td: React.CSSProperties = {
  padding: "11px 8px",
  borderBottom: "1px solid rgba(5,0,2,.07)",
  color: "rgba(5,0,2,.72)",
  whiteSpace: "nowrap",
}

const locked: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  textAlign: "center",
}

const metricValue: React.CSSProperties = {
  display: "block",
  fontSize: 34,
  lineHeight: 1,
  letterSpacing: "-0.065em",
  fontWeight: 950,
}

const metricLabel: React.CSSProperties = {
  display: "block",
  marginTop: 10,
  color: "rgba(5,0,2,.56)",
  fontSize: 14,
  lineHeight: 1.25,
  fontWeight: 850,
}
