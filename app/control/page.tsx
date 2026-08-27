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
    return {
      summary: null,
      byDay: [],
      byZone: [],
      byCampaign: [],
      recent: [],
      byRole: [],
      byRoleNeighborhood: [],
      tenantDemandRooms: [],
      matchesByNeighborhood: [],
    }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const [
    summaryRes,
    byDayRes,
    byZoneRes,
    byCampaignRes,
    recentRes,
    byRoleRes,
    byRoleNeighborhoodRes,
    tenantDemandRoomsRes,
    matchesByNeighborhoodRes,
  ] = await Promise.all([
    supabase.from("investor_lead_summary").select("*").single(),
    supabase.from("investor_leads_by_day").select("*").limit(14),
    supabase.from("investor_leads_by_zone").select("*").limit(10),
    supabase.from("investor_leads_by_campaign").select("*").limit(10),
    supabase.from("investor_recent_leads").select("*").limit(20),
    supabase.from("investor_leads_by_role").select("*").limit(20),
    supabase
      .from("investor_leads_by_role_neighborhood")
      .select("*")
      .limit(80),
    supabase
      .from("investor_tenant_demand_by_neighborhood_rooms")
      .select("*")
      .limit(80),
    supabase
      .from("investor_matches_by_neighborhood")
      .select("*")
      .limit(40),
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
    return {
      ok: false,
      spend: 0,
      impressions: 0,
      clicks: 0,
      rows: [] as any[],
    }
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

    const spend = rows.reduce(
      (sum: number, row: any) => sum + Number(row.spend || 0),
      0
    )

    const impressions = rows.reduce(
      (sum: number, row: any) => sum + Number(row.impressions || 0),
      0
    )

    const clicks = rows.reduce(
      (sum: number, row: any) => sum + Number(row.clicks || 0),
      0
    )

    return {
      ok: true,
      spend,
      impressions,
      clicks,
      rows,
    }
  } catch {
    return {
      ok: false,
      spend: 0,
      impressions: 0,
      clicks: 0,
      rows: [] as any[],
    }
  }
}

function money(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function ControlPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams

  // Mantenemos compatibilidad con el token actual para no tocar Vercel ahora.
  const requiredToken =
    process.env.CONTROL_DASHBOARD_TOKEN ||
    process.env.INVESTOR_DASHBOARD_TOKEN

  if (requiredToken && params.token !== requiredToken) {
    return (
      <main style={page}>
        <section style={locked}>
          <div>
            <p style={eyebrow}>VERLO CONTROL</p>
            <h1 style={{ marginBottom: 8 }}>Acceso privado</h1>
            <p style={{ color: "rgba(5,0,2,.58)" }}>
              Falta el token de acceso.
            </p>
          </div>
        </section>
      </main>
    )
  }

  const [supabaseData, metaData] = await Promise.all([
    getSupabaseData(),
    getMetaData(),
  ])

  const summary = supabaseData.summary

  const totalLeads = summary?.total_leads || 0
  const owners = summary?.owners || 0
  const tenants = summary?.tenants || 0

  const cpl =
    totalLeads > 0 && metaData.ok
      ? metaData.spend / totalLeads
      : 0

  const demandSupplyRatio =
    owners > 0
      ? tenants / owners
      : 0

  return (
    <main style={page}>
      <section style={shell}>
        <header style={header}>
          <div>
            <p style={eyebrow}>VERLO CONTROL</p>

            <h1 style={title}>
              El negocio,
              <br />
              en tiempo real.
            </h1>

            <p style={subtitle}>
              Adquisición, oferta, demanda, matching y comportamiento
              de usuarios en un solo lugar.
            </p>
          </div>

          <div style={headerRight}>
            <span style={liveBadge}>
              <span style={liveDot} />
              Datos reales
            </span>

            <a href="/" style={homeLink}>
              Volver
            </a>
          </div>
        </header>

        <section style={sectionBlock}>
          <SectionHeader
            kicker="NEGOCIO"
            title="Pulso general"
          />

          <section style={grid4}>
            <Metric
              label="Leads totales"
              value={totalLeads}
            />

            <Metric
              label="Inquilinos"
              value={tenants}
            />

            <Metric
              label="Propietarios"
              value={owners}
            />

            <Metric
              label="Tenants por owner"
              value={
                owners > 0
                  ? demandSupplyRatio.toLocaleString("es-AR", {
                      maximumFractionDigits: 1,
                    })
                  : "—"
              }
            />
          </section>

          <section style={grid4}>
            <Metric
              label="Leads últimos 7 días"
              value={summary?.leads_7d || 0}
            />

            <Metric
              label="Leads últimos 30 días"
              value={summary?.leads_30d || 0}
            />

            <Metric
              label="Renovaciones"
              value={summary?.renewals || 0}
            />

            <Metric
              label="Hot leads"
              value={summary?.hot_leads || 0}
            />
          </section>
        </section>

        <section style={sectionBlock}>
          <SectionHeader
            kicker="ADQUISICIÓN"
            title="Meta Ads"
          />

          <section style={grid4}>
            <Metric
              label="Gasto Meta · 30 días"
              value={
                metaData.ok
                  ? money(metaData.spend)
                  : "Sin conectar"
              }
            />

            <Metric
              label="CPL estimado"
              value={
                metaData.ok
                  ? money(cpl)
                  : "Sin conectar"
              }
            />

            <Metric
              label="Clicks · 30 días"
              value={metaData.clicks}
            />

            <Metric
              label="Impresiones · 30 días"
              value={metaData.impressions}
            />
          </section>

          <Panel title="Campañas Meta · últimos 30 días">
            <Table
              rows={metaData.rows}
              columns={[
                ["campaign_name", "Campaña"],
                ["spend", "Gasto"],
                ["impressions", "Impresiones"],
                ["clicks", "Clicks"],
                ["ctr", "CTR"],
                ["cpc", "CPC"],
                ["cpm", "CPM"],
              ]}
            />
          </Panel>
        </section>

        <section style={sectionBlock}>
          <SectionHeader
            kicker="CRECIMIENTO"
            title="Entrada de usuarios"
          />

          <section style={grid2}>
            <Panel title="Leads por día">
              <Table
                rows={supabaseData.byDay}
                columns={[
                  ["day", "Día"],
                  ["leads", "Leads"],
                  ["owners", "Owners"],
                  ["tenants", "Tenants"],
                  ["renewals", "Renov."],
                ]}
              />
            </Panel>

            <Panel title="Leads por rol">
              <AutoTable rows={supabaseData.byRole} />
            </Panel>
          </section>

          <section style={grid2}>
            <Panel title="Zonas principales">
              <Table
                rows={supabaseData.byZone}
                columns={[
                  ["zone", "Zona"],
                  ["leads", "Leads"],
                ]}
              />
            </Panel>

            <Panel title="Leads por campaña">
              <Table
                rows={supabaseData.byCampaign}
                columns={[
                  ["campaign", "Campaña"],
                  ["leads", "Leads"],
                  ["owners", "Owners"],
                  ["renewals", "Renov."],
                ]}
              />
            </Panel>
          </section>
        </section>

        <section style={sectionBlock}>
          <SectionHeader
            kicker="MARKETPLACE"
            title="Oferta, demanda y matching"
          />

          <section style={grid2}>
            <Panel title="Owners y tenants por barrio">
              <AutoTable
                rows={supabaseData.byRoleNeighborhood}
              />
            </Panel>

            <Panel title="Matches por barrio">
              <AutoTable
                rows={supabaseData.matchesByNeighborhood}
              />
            </Panel>
          </section>

          <Panel title="Demanda tenant por barrio y ambientes">
            <AutoTable
              rows={supabaseData.tenantDemandRooms}
            />
          </Panel>
        </section>

        <section style={sectionBlock}>
          <SectionHeader
            kicker="DATOS"
            title="Actividad reciente"
          />

          <Panel title="Últimos leads">
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

        <footer style={footer}>
          VERLO CONTROL · Supabase + Meta
        </footer>
      </section>
    </main>
  )
}

function SectionHeader({
  kicker,
  title,
}: {
  kicker: string
  title: string
}) {
  return (
    <div style={sectionHeader}>
      <p style={sectionKicker}>{kicker}</p>
      <h2 style={sectionTitle}>{title}</h2>
    </div>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div style={metric}>
      <strong style={metricValue}>
        {typeof value === "number"
          ? value.toLocaleString("es-AR")
          : value}
      </strong>

      <span style={metricLabel}>
        {label}
      </span>
    </div>
  )
}

function Panel({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section style={panel}>
      <h3 style={panelTitle}>{title}</h3>
      {children}
    </section>
  )
}

function AutoTable({
  rows,
}: {
  rows: any[]
}) {
  if (!rows.length) {
    return (
      <p style={empty}>
        Sin datos todavía
      </p>
    )
  }

  const columns = Object.keys(rows[0]).map(
    (key) => [key, prettifyColumn(key)] as [string, string]
  )

  return (
    <Table
      rows={rows}
      columns={columns}
    />
  )
}

function prettifyColumn(value: string) {
  const labels: Record<string, string> = {
    role: "Rol",
    neighborhood: "Barrio",
    zone: "Zona",
    rooms: "Ambientes",
    leads: "Leads",
    owners: "Owners",
    tenants: "Tenants",
    matches: "Matches",
    total: "Total",
    count: "Cantidad",
    day: "Día",
  }

  if (labels[value]) {
    return labels[value]
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
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
              <th key={key} style={th}>
                {label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                style={td}
                colSpan={columns.length}
              >
                Sin datos todavía
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index}>
                {columns.map(([key]) => (
                  <td
                    key={key}
                    style={td}
                  >
                    {formatCell(row[key])}
                  </td>
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
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—"
  }

  if (typeof value === "number") {
    return value.toLocaleString("es-AR")
  }

  if (
    typeof value === "string" &&
    value.includes("T")
  ) {
    return value.slice(0, 10)
  }

  return String(value)
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 82% 16%, rgba(242,168,169,.34), transparent 28%), #f2ebec",
  color: "#050002",
  fontFamily: "Inter, system-ui, sans-serif",
}

const shell: React.CSSProperties = {
  width: "min(1220px, calc(100% - 32px))",
  margin: "0 auto",
  padding: "42px 0 72px",
}

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 28,
  alignItems: "flex-start",
  marginBottom: 42,
  padding: 34,
  borderRadius: 36,
  background: "rgba(255,255,255,.76)",
  border: "1px solid rgba(5,0,2,.08)",
  boxShadow: "0 22px 70px rgba(5,0,2,.07)",
}

const headerRight: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "flex-end",
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
  maxWidth: 730,
  color: "rgba(5,0,2,.62)",
  fontSize: 18,
  lineHeight: 1.5,
}

const homeLink: React.CSSProperties = {
  padding: "11px 17px",
  borderRadius: 999,
  background: "#050002",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 13,
}

const liveBadge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "11px 15px",
  borderRadius: 999,
  background: "#fffaf8",
  border: "1px solid rgba(5,0,2,.09)",
  fontSize: 12,
  fontWeight: 900,
}

const liveDot: React.CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: "50%",
  background: "#c37986",
}

const sectionBlock: React.CSSProperties = {
  marginBottom: 44,
}

const sectionHeader: React.CSSProperties = {
  marginBottom: 15,
}

const sectionKicker: React.CSSProperties = {
  margin: 0,
  color: "#c37986",
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: ".14em",
}

const sectionTitle: React.CSSProperties = {
  margin: "5px 0 0",
  fontSize: 30,
  lineHeight: 1,
  letterSpacing: "-.055em",
  fontWeight: 950,
}

const grid4: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 14,
  marginBottom: 14,
}

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
  gap: 14,
  marginBottom: 14,
}

const metric: React.CSSProperties = {
  minHeight: 132,
  padding: 24,
  borderRadius: 28,
  background: "rgba(255,255,255,.8)",
  border: "1px solid rgba(5,0,2,.08)",
  boxShadow: "0 18px 50px rgba(5,0,2,.05)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
}

const metricValue: React.CSSProperties = {
  display: "block",
  fontSize: 35,
  lineHeight: 1,
  letterSpacing: "-.065em",
  fontWeight: 950,
}

const metricLabel: React.CSSProperties = {
  display: "block",
  marginTop: 10,
  color: "rgba(5,0,2,.56)",
  fontSize: 13,
  lineHeight: 1.3,
  fontWeight: 850,
}

const panel: React.CSSProperties = {
  padding: 23,
  borderRadius: 28,
  background: "rgba(255,255,255,.76)",
  border: "1px solid rgba(5,0,2,.08)",
  boxShadow: "0 18px 50px rgba(5,0,2,.05)",
  marginBottom: 14,
}

const panelTitle: React.CSSProperties = {
  margin: "0 0 17px",
  fontSize: 20,
  letterSpacing: "-.04em",
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
  color: "rgba(5,0,2,.48)",
  fontWeight: 900,
  whiteSpace: "nowrap",
}

const td: React.CSSProperties = {
  padding: "11px 8px",
  borderBottom: "1px solid rgba(5,0,2,.065)",
  color: "rgba(5,0,2,.72)",
  whiteSpace: "nowrap",
}

const empty: React.CSSProperties = {
  color: "rgba(5,0,2,.5)",
  fontSize: 13,
}

const footer: React.CSSProperties = {
  marginTop: 18,
  textAlign: "center",
  color: "rgba(5,0,2,.38)",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: ".12em",
}

const locked: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  textAlign: "center",
}
