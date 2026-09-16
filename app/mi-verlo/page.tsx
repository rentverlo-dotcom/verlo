"use client"

import {
  useCallback,
  useEffect,
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  supabase,
} from "@/lib/supabase/client"

import VerloBrand from "@/components/VerloBrand"

type Role =
  | "tenant"
  | "owner"

type Stage = {
  key: string
  label: string
  action: string
}

type Counterpart = {
  id?: string

  zone?: string | null
  area_macro?: string | null

  neighborhood_labels?:
    string[] | null

  neighborhood_slug?:
    string | null

  desired_property_type?:
    string | null

  desired_rooms?:
    string | null

  budget_range?:
    string | null

  budget_max?:
    number | null

  move_timing?:
    string | null

  property_type?:
    string | null

  property_rooms?:
    string | null

  approx_price?:
    string | null

  approx_price_number?:
    number | null

  availability_status?:
    string | null
}

type MatchItem = {
  id: string
  role: Role
  score: number
  status: string
  created_at: string

  counterpart:
    Counterpart | null

  interest: {
    tenant: boolean
    owner: boolean
    ready: boolean
  }

  post_visit: {
    tenant:
      string | null

    owner:
      string | null
  }

  stage:
    Stage

  contract:
    {
      id: string
      status: string

      monthly_price:
        number | null

      deposit:
        number | null

      start_date:
        string | null

      end_date:
        string | null

      tenant_agreed_at:
        string | null

      owner_agreed_at:
        string | null
    } | null

  rental:
    {
      id: string
      status: string
      start_date: string
      end_date: string
    } | null

  action_url:
    string | null
}

type DashboardData = {
  ok: true

  user: {
    id: string
    email: string
    full_name:
      string | null

    lead_id: string
    role: string
  }

  intake: {
    id: string
    role: string
    intent: string
    created_at: string

    tenant: {
      zone:
        string | null

      area_macro:
        string | null

      neighborhoods:
        string[] | null

      property_type:
        string | null

      rooms:
        string | null

      budget_range:
        string | null

      budget_max:
        number | null

      move_timing:
        string | null
    } | null

    owner: {
      zone:
        string | null

      neighborhood:
        string | null

      property_type:
        string | null

      rooms:
        string | null

      price:
        string | null

      price_number:
        number | null

      availability:
        string | null
    } | null
  }

  summary: {
    matches: number
    operations: number
    rentals: number
  }

  matches:
    MatchItem[]

  operations:
    MatchItem[]

  rentals:
    Array<{
      id: string
      status: string
      start_date: string
      end_date: string
    }>
}

const styles = `
  .mv-root {
    --pink: #f2a8a9;
    --pink-dark: #c37986;
    --black: #050002;
    --soft: #f2ebec;
    --cream: #efefea;
    --blue: #74bedc;
    --yellow: #e7c776;
    --white: #ffffff;

    min-height: 100vh;

    background:
      radial-gradient(
        circle at 8% 4%,
        rgba(242, 168, 169, 0.48),
        transparent 28%
      ),
      radial-gradient(
        circle at 92% 32%,
        rgba(231, 199, 118, 0.22),
        transparent 24%
      ),
      radial-gradient(
        circle at 84% 90%,
        rgba(116, 190, 220, 0.18),
        transparent 28%
      ),
      var(--soft);

    color:
      var(--black);

    font-family:
      Inter,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .mv-root * {
    box-sizing:
      border-box;
  }

  .mv-nav {
    min-height:
      76px;

    display:
      flex;

    align-items:
      center;

    background:
      rgba(
        242,
        235,
        236,
        0.78
      );

    border-bottom:
      1px solid
      rgba(
        5,
        0,
        2,
        0.08
      );

    backdrop-filter:
      blur(20px);

    position:
      sticky;

    top:
      0;

    z-index:
      30;
  }

  .mv-container {
    width:
      min(
        1180px,
        calc(100% - 40px)
      );

    margin:
      0 auto;
  }

  .mv-nav-inner {
    display:
      flex;

    align-items:
      center;

    justify-content:
      space-between;

    gap:
      20px;
  }

  .mv-nav-actions {
    display:
      flex;

    align-items:
      center;

    gap:
      10px;
  }

  .mv-user {
    max-width:
      220px;

    white-space:
      nowrap;

    overflow:
      hidden;

    text-overflow:
      ellipsis;

    font-size:
      13px;

    font-weight:
      850;

    color:
      rgba(
        5,
        0,
        2,
        0.58
      );
  }

  .mv-logout {
    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.12
      );

    background:
      rgba(
        255,
        255,
        255,
        0.7
      );

    color:
      var(--black);

    min-height:
      40px;

    padding:
      0 16px;

    border-radius:
      999px;

    font-weight:
      900;

    cursor:
      pointer;
  }

  .mv-main {
    padding:
      64px 0 90px;
  }

  .mv-hero {
    display:
      grid;

    grid-template-columns:
      minmax(
        0,
        1.5fr
      )
      minmax(
        300px,
        0.8fr
      );

    gap:
      24px;

    align-items:
      stretch;
  }

  .mv-hero-copy {
    padding:
      36px 0;
  }

  .mv-eyebrow {
    display:
      inline-flex;

    align-items:
      center;

    gap:
      8px;

    padding:
      9px 13px;

    border-radius:
      999px;

    background:
      rgba(
        255,
        255,
        255,
        0.72
      );

    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.08
      );

    font-size:
      12px;

    font-weight:
      950;

    letter-spacing:
      0.08em;

    text-transform:
      uppercase;
  }

  .mv-eyebrow-dot {
    width:
      8px;

    height:
      8px;

    border-radius:
      999px;

    background:
      var(--pink-dark);
  }

  .mv-title {
    margin:
      22px 0 0;

    max-width:
      760px;

    font-size:
      clamp(
        54px,
        8vw,
        102px
      );

    line-height:
      0.87;

    letter-spacing:
      -0.085em;

    font-weight:
      950;
  }

  .mv-title em {
    font-family:
      Georgia,
      "Times New Roman",
      serif;

    font-style:
      italic;

    font-weight:
      400;

    letter-spacing:
      -0.055em;
  }

  .mv-subtitle {
    margin:
      24px 0 0;

    max-width:
      620px;

    color:
      rgba(
        5,
        0,
        2,
        0.62
      );

    font-size:
      18px;

    line-height:
      1.5;

    font-weight:
      650;
  }

  .mv-summary {
    display:
      grid;

    grid-template-columns:
      repeat(
        3,
        1fr
      );

    gap:
      10px;

    padding:
      18px;

    border-radius:
      34px;

    background:
      rgba(
        255,
        255,
        255,
        0.72
      );

    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.08
      );

    box-shadow:
      0 24px 70px
      rgba(
        5,
        0,
        2,
        0.07
      );
  }

  .mv-stat {
    min-height:
      124px;

    padding:
      18px;

    border-radius:
      24px;

    background:
      rgba(
        242,
        235,
        236,
        0.62
      );

    display:
      flex;

    flex-direction:
      column;

    justify-content:
      space-between;
  }

  .mv-stat strong {
    font-size:
      42px;

    line-height:
      1;

    letter-spacing:
      -0.06em;
  }

  .mv-stat span {
    font-size:
      12px;

    font-weight:
      900;

    text-transform:
      uppercase;

    letter-spacing:
      0.06em;

    color:
      rgba(
        5,
        0,
        2,
        0.48
      );
  }

  .mv-section {
    margin-top:
      68px;
  }

  .mv-section-heading {
    display:
      flex;

    align-items:
      end;

    justify-content:
      space-between;

    gap:
      20px;

    margin-bottom:
      20px;
  }

  .mv-section-kicker {
    display:
      block;

    margin-bottom:
      8px;

    font-size:
      11px;

    font-weight:
      950;

    letter-spacing:
      0.12em;

    text-transform:
      uppercase;

    color:
      var(--pink-dark);
  }

  .mv-section-heading h2 {
    margin:
      0;

    font-size:
      clamp(
        32px,
        4vw,
        48px
      );

    line-height:
      0.95;

    letter-spacing:
      -0.055em;
  }

  .mv-section-heading p {
    margin:
      0;

    max-width:
      420px;

    color:
      rgba(
        5,
        0,
        2,
        0.54
      );

    line-height:
      1.45;

    font-size:
      14px;

    font-weight:
      650;

    text-align:
      right;
  }

  .mv-intake-card {
    padding:
      28px;

    border-radius:
      34px;

    background:
      rgba(
        255,
        255,
        255,
        0.78
      );

    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.08
      );

    box-shadow:
      0 24px 70px
      rgba(
        5,
        0,
        2,
        0.06
      );
  }

  .mv-intake-top {
    display:
      flex;

    align-items:
      center;

    justify-content:
      space-between;

    gap:
      16px;
  }

  .mv-intake-title {
    margin:
      0;

    font-size:
      27px;

    line-height:
      1;

    letter-spacing:
      -0.04em;
  }

  .mv-pill {
    display:
      inline-flex;

    align-items:
      center;

    width:
      fit-content;

    min-height:
      30px;

    padding:
      0 11px;

    border-radius:
      999px;

    font-size:
      11px;

    line-height:
      1;

    font-weight:
      950;

    letter-spacing:
      0.06em;

    text-transform:
      uppercase;

    background:
      rgba(
        242,
        168,
        169,
        0.22
      );

    color:
      #7b3846;
  }

  .mv-pill.blue {
    background:
      rgba(
        116,
        190,
        220,
        0.18
      );

    color:
      #255a6d;
  }

  .mv-pill.yellow {
    background:
      rgba(
        231,
        199,
        118,
        0.25
      );

    color:
      #725c1f;
  }

  .mv-pill.black {
    background:
      var(--black);

    color:
      white;
  }

  .mv-info-grid {
    display:
      grid;

    grid-template-columns:
      repeat(
        4,
        minmax(
          0,
          1fr
        )
      );

    gap:
      12px;

    margin-top:
      24px;
  }

  .mv-info {
    padding:
      17px;

    border-radius:
      21px;

    background:
      rgba(
        242,
        235,
        236,
        0.65
      );

    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.05
      );
  }

  .mv-info span {
    display:
      block;

    font-size:
      11px;

    font-weight:
      900;

    letter-spacing:
      0.06em;

    text-transform:
      uppercase;

    color:
      rgba(
        5,
        0,
        2,
        0.42
      );
  }

  .mv-info strong {
    display:
      block;

    margin-top:
      7px;

    font-size:
      15px;

    line-height:
      1.35;
  }

  .mv-grid {
    display:
      grid;

    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );

    gap:
      16px;
  }

  .mv-match-card {
    padding:
      24px;

    border-radius:
      30px;

    background:
      rgba(
        255,
        255,
        255,
        0.8
      );

    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.08
      );

    box-shadow:
      0 18px 50px
      rgba(
        5,
        0,
        2,
        0.05
      );
  }

  .mv-match-top {
    display:
      flex;

    align-items:
      flex-start;

    justify-content:
      space-between;

    gap:
      12px;
  }

  .mv-score {
    font-size:
      34px;

    font-weight:
      950;

    letter-spacing:
      -0.06em;

    line-height:
      1;
  }

  .mv-score span {
    font-size:
      15px;

    letter-spacing:
      -0.02em;
  }

  .mv-match-title {
    margin:
      24px 0 0;

    font-size:
      27px;

    line-height:
      1;

    letter-spacing:
      -0.045em;
  }

  .mv-match-copy {
    margin:
      10px 0 0;

    color:
      rgba(
        5,
        0,
        2,
        0.56
      );

    line-height:
      1.5;

    font-size:
      14px;

    font-weight:
      650;
  }

  .mv-mini-grid {
    display:
      grid;

    grid-template-columns:
      repeat(
        2,
        1fr
      );

    gap:
      8px;

    margin-top:
      20px;
  }

  .mv-mini {
    padding:
      12px;

    border-radius:
      16px;

    background:
      rgba(
        242,
        235,
        236,
        0.65
      );
  }

  .mv-mini span {
    display:
      block;

    font-size:
      10px;

    font-weight:
      900;

    text-transform:
      uppercase;

    letter-spacing:
      0.05em;

    color:
      rgba(
        5,
        0,
        2,
        0.4
      );
  }

  .mv-mini strong {
    display:
      block;

    margin-top:
      4px;

    font-size:
      13px;
  }

  .mv-action {
    width:
      100%;

    min-height:
      54px;

    margin-top:
      20px;

    padding:
      0 20px;

    border:
      none;

    border-radius:
      999px;

    background:
      var(--black);

    color:
      white;

    font-family:
      inherit;

    font-size:
      14px;

    font-weight:
      950;

    cursor:
      pointer;

    display:
      inline-flex;

    align-items:
      center;

    justify-content:
      center;

    text-decoration:
      none;
  }

  .mv-action.disabled {
    opacity:
      0.38;

    pointer-events:
      none;
  }

  .mv-empty {
    padding:
      32px;

    border-radius:
      30px;

    border:
      1px dashed
      rgba(
        5,
        0,
        2,
        0.16
      );

    background:
      rgba(
        255,
        255,
        255,
        0.42
      );

    color:
      rgba(
        5,
        0,
        2,
        0.52
      );

    font-size:
      15px;

    line-height:
      1.5;

    font-weight:
      700;
  }

  .mv-loading,
  .mv-error {
    min-height:
      calc(
        100vh - 76px
      );

    display:
      grid;

    place-items:
      center;

    padding:
      30px;
  }

  .mv-state-card {
    width:
      min(
        520px,
        100%
      );

    padding:
      36px;

    border-radius:
      32px;

    background:
      rgba(
        255,
        255,
        255,
        0.82
      );

    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.08
      );

    text-align:
      center;
  }

  .mv-state-card h1 {
    margin:
      0;

    font-size:
      42px;

    letter-spacing:
      -0.055em;
  }

  .mv-state-card p {
    margin:
      14px 0 0;

    color:
      rgba(
        5,
        0,
        2,
        0.56
      );

    line-height:
      1.5;
  }

  @media (
    max-width: 900px
  ) {
    .mv-hero {
      grid-template-columns:
        1fr;
    }

    .mv-summary {
      max-width:
        520px;
    }

    .mv-info-grid {
      grid-template-columns:
        repeat(
          2,
          minmax(
            0,
            1fr
          )
        );
    }

    .mv-grid {
      grid-template-columns:
        1fr;
    }
  }

  @media (
    max-width: 620px
  ) {
    .mv-nav {
      min-height:
        66px;
    }

    .mv-container {
      width:
        min(
          100% - 28px,
          1180px
        );
    }

    .mv-user {
      display:
        none;
    }

    .mv-main {
      padding:
        36px 0 64px;
    }

    .mv-hero-copy {
      padding:
        12px 0;
    }

    .mv-title {
      font-size:
        clamp(
          52px,
          17vw,
          78px
        );
    }

    .mv-summary {
      grid-template-columns:
        repeat(
          3,
          1fr
        );

      padding:
        10px;

      border-radius:
        26px;
    }

    .mv-stat {
      min-height:
        98px;

      padding:
        13px;

      border-radius:
        18px;
    }

    .mv-stat strong {
      font-size:
        30px;
    }

    .mv-stat span {
      font-size:
        9px;
    }

    .mv-section {
      margin-top:
        50px;
    }

    .mv-section-heading {
      display:
        block;
    }

    .mv-section-heading p {
      margin-top:
        10px;

      text-align:
        left;
    }

    .mv-intake-card,
    .mv-match-card {
      padding:
        20px;

      border-radius:
        26px;
    }

    .mv-info-grid {
      grid-template-columns:
        1fr;
    }
  }
`

function money(
  value:
    number |
    null |
    undefined
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "—"
  }

  return new Intl.NumberFormat(
    "es-AR",
    {
      style:
        "currency",

      currency:
        "ARS",

      maximumFractionDigits:
        0,
    }
  ).format(
    value
  )
}

function humanize(
  value:
    string |
    null |
    undefined
) {
  if (!value) return "—"

  const map:
    Record<
      string,
      string
    > = {
      apartment:
        "Departamento",

      house:
        "Casa",

      room:
        "Habitación",

      hotel_room:
        "Habitación",

      tenant:
        "Inquilino",

      owner:
        "Propietario",

      both:
        "Inquilino y propietario",
    }

  if (
    map[value]
  ) {
    return map[value]
  }

  return value
    .replace(
      /_/g,
      " "
    )
    .replace(
      /-/g,
      " "
    )
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase()
    )
}

function stageClass(
  key: string
) {
  if (
    key ===
      "rental_active" ||
    key ===
      "contract_agreed"
  ) {
    return "mv-pill black"
  }

  if (
    key ===
      "interest_action" ||
    key ===
      "post_visit_action" ||
    key ===
      "contract_acceptance_pending"
  ) {
    return "mv-pill yellow"
  }

  if (
    key ===
      "double_ok" ||
    key ===
      "second_double_ok" ||
    key ===
      "closing"
  ) {
    return "mv-pill blue"
  }

  return "mv-pill"
}

function getCardTitle(
  item:
    MatchItem
) {
  const counterpart =
    item.counterpart

  if (!counterpart) {
    return item.role ===
      "tenant"
      ? "Propiedad compatible"
      : "Inquilino compatible"
  }

  if (
    item.role ===
    "tenant"
  ) {
    const place =
      counterpart
        .neighborhood_slug ||
      counterpart.zone ||
      counterpart.area_macro

    const property =
      humanize(
        counterpart
          .property_type
      )

    if (
      place &&
      property !== "—"
    ) {
      return `${property} · ${humanize(
        place
      )}`
    }

    return (
      place
        ? humanize(
            place
          )
        : "Propiedad compatible"
    )
  }

  const neighborhoods =
    counterpart
      .neighborhood_labels

  const place =
    neighborhoods &&
    neighborhoods.length >
      0
      ? neighborhoods[0]
      : counterpart.zone ||
        counterpart.area_macro

  return place
    ? `Búsqueda en ${humanize(
        place
      )}`
    : "Inquilino compatible"
}

function MatchCard({
  item,
}: {
  item: MatchItem
}) {
  const counterpart =
    item.counterpart

  const isTenant =
    item.role ===
    "tenant"

  const valueOne =
    isTenant
      ? humanize(
          counterpart
            ?.property_type
        )
      : humanize(
          counterpart
            ?.desired_property_type
        )

  const valueTwo =
    isTenant
      ? counterpart
          ?.property_rooms ||
        "—"
      : counterpart
          ?.desired_rooms ||
        "—"

  const price =
    isTenant
      ? counterpart
          ?.approx_price ||
        money(
          counterpart
            ?.approx_price_number
        )
      : money(
          counterpart
            ?.budget_max
        )

  return (
    <article className="mv-match-card">
      <div className="mv-match-top">
        <div className="mv-score">
          {Math.round(
            Number(
              item.score ||
              0
            )
          )}
          <span>
            %
          </span>
        </div>

        <span
          className={
            stageClass(
              item
                .stage
                .key
            )
          }
        >
          {
            item
              .stage
              .label
          }
        </span>
      </div>

      <h3 className="mv-match-title">
        {getCardTitle(
          item
        )}
      </h3>

      <p className="mv-match-copy">
        {isTenant
          ? "Esta propiedad coincide con los datos de tu búsqueda."
          : "Esta búsqueda coincide con los datos de tu propiedad."}
      </p>

      <div className="mv-mini-grid">
        <div className="mv-mini">
          <span>
            {isTenant
              ? "Tipo"
              : "Busca"}
          </span>

          <strong>
            {valueOne}
          </strong>
        </div>

        <div className="mv-mini">
          <span>
            Ambientes
          </span>

          <strong>
            {valueTwo}
          </strong>
        </div>

        <div className="mv-mini">
          <span>
            {isTenant
              ? "Precio"
              : "Presupuesto"}
          </span>

          <strong>
            {price}
          </strong>
        </div>

        <div className="mv-mini">
          <span>
            Estado
          </span>

          <strong>
            {
              item
                .stage
                .label
            }
          </strong>
        </div>
      </div>

      {item.action_url ? (
        <a
          href={
            item.action_url
          }
          className="mv-action"
        >
          {
            item
              .stage
              .action
          }
        </a>
      ) : (
        <span className="mv-action disabled">
          {
            item
              .stage
              .action
          }
        </span>
      )}
    </article>
  )
}

export default function MiVerloPage() {
  const router =
    useRouter()

  const [
    data,
    setData,
  ] =
    useState<DashboardData | null>(
      null
    )

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    )

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    )

  const load =
    useCallback(
      async () => {
        setLoading(
          true
        )

        setError(
          null
        )

        try {
          const {
            data:
              sessionData,
          } =
            await supabase
              .auth
              .getSession()

          const session =
            sessionData.session

          if (!session) {
            router.replace(
              "/login?next=%2Fmi-verlo"
            )

            return
          }

          const response =
            await fetch(
              "/api/mi-verlo",
              {
                method:
                  "GET",

                headers: {
                  Authorization:
                    `Bearer ${session.access_token}`,
                },

                cache:
                  "no-store",
              }
            )

          if (
            response.status ===
            401
          ) {
            router.replace(
              "/login?next=%2Fmi-verlo"
            )

            return
          }

          const result =
            await response
              .json()
              .catch(
                () => ({})
              )

          if (
            !response.ok ||
            !result?.ok
          ) {
            throw new Error(
              result?.error ||
                "No pudimos cargar Mi Verlo."
            )
          }

          setData(
            result as DashboardData
          )
        } catch (
          error
        ) {
          setError(
            error instanceof
              Error
              ? error.message
              : "No pudimos cargar Mi Verlo."
          )
        } finally {
          setLoading(
            false
          )
        }
      },
      [
        router,
      ]
    )

  useEffect(
    () => {
      load()
    },
    [
      load,
    ]
  )

  async function logout() {
    await supabase
      .auth
      .signOut()

    router.replace(
      "/"
    )
  }

  if (
    loading
  ) {
    return (
      <>
        <style>
          {styles}
        </style>

        <div className="mv-root">
          <header className="mv-nav">
            <div className="mv-container">
              <VerloBrand />
            </div>
          </header>

          <main className="mv-loading">
            <div className="mv-state-card">
              <h1>
                Mi Verlo
              </h1>

              <p>
                Estamos cargando tu espacio.
              </p>
            </div>
          </main>
        </div>
      </>
    )
  }

  if (
    error ||
    !data
  ) {
    return (
      <>
        <style>
          {styles}
        </style>

        <div className="mv-root">
          <header className="mv-nav">
            <div className="mv-container">
              <VerloBrand />
            </div>
          </header>

          <main className="mv-error">
            <div className="mv-state-card">
              <h1>
                No pudimos cargar
              </h1>

              <p>
                {error ||
                  "Probá nuevamente."}
              </p>

              <button
                type="button"
                className="mv-action"
                onClick={
                  load
                }
              >
                REINTENTAR
              </button>
            </div>
          </main>
        </div>
      </>
    )
  }

  const name =
    data
      .user
      .full_name
      ?.split(" ")[0] ||
    ""

  const tenant =
    data
      .intake
      .tenant

  const owner =
    data
      .intake
      .owner

  return (
    <>
      <style>
        {styles}
      </style>

      <div className="mv-root">

        <header className="mv-nav">
          <div className="mv-container mv-nav-inner">
            <VerloBrand />

            <div className="mv-nav-actions">
              <span className="mv-user">
                {
                  data
                    .user
                    .email
                }
              </span>

              <button
                type="button"
                className="mv-logout"
                onClick={
                  logout
                }
              >
                Salir
              </button>
            </div>
          </div>
        </header>

        <main className="mv-main">
          <div className="mv-container">

            <section className="mv-hero">
              <div className="mv-hero-copy">
                <span className="mv-eyebrow">
                  <span className="mv-eyebrow-dot" />
                  Tu espacio en Verlo
                </span>

                <h1 className="mv-title">
                  {name
                    ? `Hola, ${name}.`
                    : "Hola."}
                  <br />

                  <em>
                    Acá pasa todo.
                  </em>
                </h1>

                <p className="mv-subtitle">
                  Seguí tus matches, operaciones
                  y próximos pasos desde un solo lugar.
                </p>
              </div>

              <div className="mv-summary">
                <div className="mv-stat">
                  <strong>
                    {
                      data
                        .summary
                        .matches
                    }
                  </strong>

                  <span>
                    Matches
                  </span>
                </div>

                <div className="mv-stat">
                  <strong>
                    {
                      data
                        .summary
                        .operations
                    }
                  </strong>

                  <span>
                    Operaciones
                  </span>
                </div>

                <div className="mv-stat">
                  <strong>
                    {
                      data
                        .summary
                        .rentals
                    }
                  </strong>

                  <span>
                    Alquileres
                  </span>
                </div>
              </div>
            </section>

            <section className="mv-section">
              <div className="mv-section-heading">
                <div>
                  <span className="mv-section-kicker">
                    TU ACTIVIDAD
                  </span>

                  <h2>
                    {tenant
                      ? "Mi búsqueda"
                      : owner
                        ? "Mi propiedad"
                        : "Mi registro"}
                  </h2>
                </div>

                <p>
                  Estos son los datos con los que Verlo
                  está trabajando para encontrar compatibilidades.
                </p>
              </div>

              <article className="mv-intake-card">
                <div className="mv-intake-top">
                  <h3 className="mv-intake-title">
                    {tenant
                      ? "Búsqueda activa"
                      : owner
                        ? "Propiedad activa"
                        : "Registro activo"}
                  </h3>

                  <span className="mv-pill black">
                    ACTIVO
                  </span>
                </div>

                {tenant && (
                  <div className="mv-info-grid">
                    <div className="mv-info">
                      <span>
                        Zona
                      </span>

                      <strong>
                        {tenant
                          .neighborhoods
                          ?.length
                          ? tenant
                              .neighborhoods
                              .join(", ")
                          : tenant.zone ||
                            tenant.area_macro ||
                            "—"}
                      </strong>
                    </div>

                    <div className="mv-info">
                      <span>
                        Tipo
                      </span>

                      <strong>
                        {humanize(
                          tenant
                            .property_type
                        )}
                      </strong>
                    </div>

                    <div className="mv-info">
                      <span>
                        Ambientes
                      </span>

                      <strong>
                        {tenant.rooms ||
                          "—"}
                      </strong>
                    </div>

                    <div className="mv-info">
                      <span>
                        Presupuesto
                      </span>

                      <strong>
                        {money(
                          tenant
                            .budget_max
                        )}
                      </strong>
                    </div>

                    <div className="mv-info">
                      <span>
                        Mudanza
                      </span>

                      <strong>
                        {humanize(
                          tenant
                            .move_timing
                        )}
                      </strong>
                    </div>
                  </div>
                )}

                {owner && (
                  <div className="mv-info-grid">
                    <div className="mv-info">
                      <span>
                        Zona
                      </span>

                      <strong>
                        {humanize(
                          owner
                            .neighborhood ||
                          owner.zone
                        )}
                      </strong>
                    </div>

                    <div className="mv-info">
                      <span>
                        Tipo
                      </span>

                      <strong>
                        {humanize(
                          owner
                            .property_type
                        )}
                      </strong>
                    </div>

                    <div className="mv-info">
                      <span>
                        Ambientes
                      </span>

                      <strong>
                        {owner.rooms ||
                          "—"}
                      </strong>
                    </div>

                    <div className="mv-info">
                      <span>
                        Precio
                      </span>

                      <strong>
                        {owner.price ||
                          money(
                            owner
                              .price_number
                          )}
                      </strong>
                    </div>

                    <div className="mv-info">
                      <span>
                        Disponibilidad
                      </span>

                      <strong>
                        {humanize(
                          owner
                            .availability
                        )}
                      </strong>
                    </div>
                  </div>
                )}
              </article>
            </section>

            <section className="mv-section">
              <div className="mv-section-heading">
                <div>
                  <span className="mv-section-kicker">
                    COMPATIBILIDADES
                  </span>

                  <h2>
                    Mis matches
                  </h2>
                </div>

                <p>
                  Acá aparecen las compatibilidades nuevas
                  y las respuestas pendientes.
                </p>
              </div>

              {data
                .matches
                .length >
              0 ? (
                <div className="mv-grid">
                  {data
                    .matches
                    .map(
                      item => (
                        <MatchCard
                          key={
                            item.id
                          }
                          item={
                            item
                          }
                        />
                      )
                    )}
                </div>
              ) : (
                <div className="mv-empty">
                  Todavía no tenés nuevos matches.
                  Cuando aparezca una compatibilidad,
                  te la vamos a mostrar acá y te
                  avisaremos por notificación.
                </div>
              )}
            </section>

            <section className="mv-section">
              <div className="mv-section-heading">
                <div>
                  <span className="mv-section-kicker">
                    EN CURSO
                  </span>

                  <h2>
                    Mis operaciones
                  </h2>
                </div>

                <p>
                  Todo lo que ya pasó del match
                  y requiere seguimiento queda acá.
                </p>
              </div>

              {data
                .operations
                .length >
              0 ? (
                <div className="mv-grid">
                  {data
                    .operations
                    .map(
                      item => (
                        <MatchCard
                          key={
                            item.id
                          }
                          item={
                            item
                          }
                        />
                      )
                    )}
                </div>
              ) : (
                <div className="mv-empty">
                  No tenés operaciones activas.
                  Cuando las dos partes quieran avanzar,
                  esa operación va a aparecer acá.
                </div>
              )}
            </section>

          </div>
        </main>
      </div>
    </>
  )
}
