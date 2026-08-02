import Link from "next/link"

type Flow = {
  id: string
  badge: string
  title: string
  subtitle: string
  description: string
  cta: string
  buttonText: string
  fields: { label: string; value: string }[]
}

const flows: Flow[] = [
  {
    id: "alquilar",
    badge: "Búsqueda activa",
    title: "Buscá sin comisión",
    subtitle: "Más control. Más ahorro.",
    description:
      "Dejanos zona, presupuesto y fecha de mudanza. Si aparece algo compatible, avanzás directo.",
    cta: "Busco alquilar",
    buttonText: "Quiero buscar alquiler",
    fields: [
      { label: "Zona", value: "Vicente López" },
      { label: "Presupuesto", value: "$500k - $700k" },
      { label: "Mudanza", value: "Próximos 30 días" },
      { label: "Estado", value: "Match posible" },
    ],
  },
  {
    id: "propiedad",
    badge: "Propietario",
    title: "Dejá tus datos",
    subtitle: "Sin publicar ni subir fotos.",
    description:
      "Contanos qué propiedad tenés. Primero validamos compatibilidad e interés. Las fotos pueden esperar.",
    cta: "Tengo una propiedad",
    buttonText: "Quiero ofrecer mi propiedad",
    fields: [
      { label: "Tipo", value: "Departamento" },
      { label: "Fotos", value: "No requeridas" },
      { label: "Paso 1", value: "Datos básicos" },
      { label: "Objetivo", value: "Recibir interesados" },
    ],
  },
  {
    id: "renovar",
    badge: "Renovación",
    title: "Renová sin comisión",
    subtitle: "Rápido, seguro y ordenado.",
    description:
      "Si ya existe acuerdo entre las partes, ordenamos los datos y avanzamos a una firma digital simple.",
    cta: "Quiero renovar",
    buttonText: "Quiero renovar contrato",
    fields: [
      { label: "Contrato", value: "Por renovar" },
      { label: "Partes", value: "Inquilino + propietario" },
      { label: "Proceso", value: "Ordenado" },
      { label: "Firma", value: "Digital" },
    ],
  },
]

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-16 w-24 shrink-0">
        <div className="absolute left-0 top-1/2 h-14 w-14 -translate-y-1/2 rounded-full border-[8px] border-black bg-transparent" />
        <div className="absolute left-8 top-1/2 h-14 w-14 -translate-y-1/2 rounded-full border-[8px] border-black bg-transparent" />
        <div className="absolute left-[31px] top-1/2 h-12 w-6 -translate-y-1/2 rounded-full bg-[#efb4bf]" />
      </div>
      <span className="text-4xl font-semibold italic leading-none tracking-tight text-black">
        verlo
      </span>
    </div>
  )
}

function PhoneMockup({
  badge,
  title,
  subtitle,
  fields,
}: Pick<Flow, "badge" | "title" | "subtitle" | "fields">) {
  return (
    <div className="mx-auto w-full max-w-[360px]">
      <div className="rounded-[42px] border-[8px] border-black bg-[#fffafa] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white">
          <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
            <span className="text-3xl font-semibold italic leading-none tracking-tight text-black">
              verlo
            </span>
            <div className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-black" />
              <span className="h-2.5 w-2.5 rounded-full bg-black" />
              <span className="h-2.5 w-2.5 rounded-full bg-black" />
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div className="inline-flex rounded-full bg-[#f6dfe4] px-3 py-1 text-sm font-bold text-[#b45d6d]">
              {badge}
            </div>

            <div>
              <h3 className="text-[2.2rem] font-black leading-[0.95] tracking-[-0.04em] text-black">
                {title}
              </h3>
              <p className="mt-3 text-[1.05rem] font-semibold leading-snug text-black/60">
                {subtitle}
              </p>
            </div>

            <div className="rounded-[26px] border border-black/10 bg-[#fbfbfb] p-4">
              <div className="space-y-0">
                {fields.map((field, index) => (
                  <div
                    key={`${field.label}-${index}`}
                    className={`flex items-center justify-between gap-4 py-3 ${
                      index !== fields.length - 1 ? "border-b border-black/10" : ""
                    }`}
                  >
                    <span className="text-sm font-semibold text-black/45">
                      {field.label}
                    </span>
                    <span className="text-right text-base font-black text-black">
                      {field.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full rounded-full bg-black px-5 py-4 text-sm font-bold text-white">
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function HeroPhone() {
  return (
    <div className="mx-auto w-full max-w-[420px]">
      <div className="rounded-[52px] border-[10px] border-black bg-[#f4dfe4] p-4 shadow-[0_25px_80px_rgba(0,0,0,0.08)]">
        <div className="overflow-hidden rounded-[34px] bg-white">
          <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
            <span className="text-[2rem] font-semibold italic leading-none tracking-tight text-black">
              verlo
            </span>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-black" />
              <span className="h-2.5 w-2.5 rounded-full bg-black" />
              <span className="h-2.5 w-2.5 rounded-full bg-black" />
            </div>
          </div>

          <div className="space-y-6 p-6">
            <div className="inline-flex rounded-full bg-[#f6dfe4] px-3 py-1 text-sm font-bold text-[#b45d6d]">
              Alquiler directo
            </div>

            <div>
              <h2 className="text-[3rem] font-black leading-[0.9] tracking-[-0.05em] text-black">
                Menos comisión.
                <br />
                Más control.
              </h2>
              <p className="mt-4 max-w-[280px] text-lg font-semibold leading-snug text-black/55">
                Verlo prioriza datos útiles: zona, presupuesto, fecha de mudanza y compatibilidad.
              </p>
            </div>

            <div className="rounded-[28px] border border-black/10 bg-[#fafafa] p-5">
              <div className="space-y-0">
                {[
                  ["Zona", "CABA Norte"],
                  ["Tipo", "2 ambientes"],
                  ["Presupuesto", "$650k"],
                  ["Estado", "Match posible"],
                ].map(([label, value], index, arr) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between py-3 ${
                      index !== arr.length - 1 ? "border-b border-black/10" : ""
                    }`}
                  >
                    <span className="text-sm font-semibold text-black/45">{label}</span>
                    <span className="text-base font-black text-black">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full rounded-full bg-black px-5 py-4 text-base font-bold text-white">
              Empezar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PageDePrueba() {
  return (
    <main className="min-h-screen bg-[#f8f1f2] text-black">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#fcf7f7]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <Link href="/" className="shrink-0">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#alquilar" className="text-sm font-bold text-black/70 transition hover:text-black">
              Busco alquilar
            </a>
            <a href="#propiedad" className="text-sm font-bold text-black/70 transition hover:text-black">
              Tengo una propiedad
            </a>
            <a href="#renovar" className="text-sm font-bold text-black/70 transition hover:text-black">
              Quiero renovar
            </a>
            <a
              href="#sumate"
              className="rounded-full bg-black px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Empezar
            </a>
          </nav>

          <a
            href="#sumate"
            className="rounded-full bg-black px-5 py-3 text-sm font-bold text-white md:hidden"
          >
            Empezar
          </a>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:py-20">
        <div>
          <div className="mb-6 inline-flex rounded-full bg-[#f3dce1] px-4 py-2 text-sm font-bold text-[#a95466]">
            Alquiler directo, más simple y más barato
          </div>

          <h1 className="max-w-[720px] text-[4.5rem] font-black leading-[0.88] tracking-[-0.06em] text-black sm:text-[5.5rem] lg:text-[6.5rem]">
            Alquilá directo,
            <br />
            <span className="font-semibold italic tracking-[-0.04em]">
              seguro y sin comisión.
            </span>
          </h1>

          <p className="mt-8 max-w-[680px] text-xl font-medium leading-relaxed text-black/68">
            Si querés alquilar, ofrecer una propiedad o renovar contrato, en Verlo
            entrás por el camino correcto desde el primer clic.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href="#sumate"
              className="rounded-full bg-black px-7 py-4 text-center text-base font-bold text-white transition hover:opacity-90"
            >
              Quiero empezar
            </a>
            <a
              href="#caminos"
              className="rounded-full border border-black/15 bg-white px-7 py-4 text-center text-base font-bold text-black transition hover:bg-black/5"
            >
              Ver opciones
            </a>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <HeroPhone />
        </div>
      </section>

      <section id="caminos" className="mx-auto max-w-7xl px-6 pb-16 lg:px-10 lg:pb-24">
        <div className="max-w-4xl">
          <div className="mb-6 inline-flex rounded-full bg-[#f3dce1] px-4 py-2 text-sm font-bold text-[#a95466]">
            Elegí cómo querés avanzar
          </div>

          <h2 className="max-w-[1000px] text-[3.4rem] font-black leading-[0.92] tracking-[-0.05em] text-black sm:text-[4.3rem]">
            Un camino simple para cada necesidad.
          </h2>

          <p className="mt-6 max-w-[760px] text-xl font-medium leading-relaxed text-black/68">
            Llegaste para resolver algo puntual. Elegí tu opción y avanzá sin dar vueltas.
          </p>
        </div>

        <div className="mt-14 grid gap-10 xl:grid-cols-3">
          {flows.map((flow) => (
            <article key={flow.id} id={flow.id} className="flex flex-col">
              <PhoneMockup
                badge={flow.badge}
                title={flow.title}
                subtitle={flow.subtitle}
                fields={flow.fields}
              />

              <div className="mt-8 px-1">
                <h3 className="text-[2rem] font-black leading-tight tracking-[-0.04em] text-black">
                  {flow.cta}
                </h3>

                <p className="mt-4 max-w-[420px] text-lg font-medium leading-relaxed text-black/68">
                  {flow.description}
                </p>

                <a
                  href="#sumate"
                  className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
                >
                  {flow.buttonText}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="sumate" className="mx-auto max-w-7xl px-6 pb-20 lg:px-10">
        <div className="rounded-[40px] border border-black/10 bg-white p-8 sm:p-10 lg:p-12">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex rounded-full bg-[#f3dce1] px-4 py-2 text-sm font-bold text-[#a95466]">
              Empezá ahora
            </div>

            <h2 className="text-[3rem] font-black leading-[0.94] tracking-[-0.05em] text-black sm:text-[4rem]">
              Dejá tus datos y seguimos por el camino correcto.
            </h2>

            <p className="mt-5 max-w-2xl text-lg font-medium leading-relaxed text-black/65">
              Acá después conectás el formulario real según el caso: inquilino,
              propietario o renovación.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <button className="rounded-full border border-black/10 bg-[#f8f1f2] px-6 py-4 text-sm font-bold text-black transition hover:bg-[#f2e4e7]">
              Busco alquilar
            </button>
            <button className="rounded-full border border-black/10 bg-[#f8f1f2] px-6 py-4 text-sm font-bold text-black transition hover:bg-[#f2e4e7]">
              Tengo una propiedad
            </button>
            <button className="rounded-full border border-black/10 bg-[#f8f1f2] px-6 py-4 text-sm font-bold text-black transition hover:bg-[#f2e4e7]">
              Quiero renovar
            </button>
          </div>

          <div className="mt-10 rounded-[28px] bg-[#f8f1f2] p-6 sm:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              <input
                type="text"
                placeholder="Nombre completo"
                className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-base font-medium text-black outline-none placeholder:text-black/35 focus:border-black/30"
              />
              <input
                type="text"
                placeholder="WhatsApp"
                className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-base font-medium text-black outline-none placeholder:text-black/35 focus:border-black/30"
              />
              <input
                type="email"
                placeholder="Email"
                className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-base font-medium text-black outline-none placeholder:text-black/35 focus:border-black/30"
              />
              <input
                type="text"
                placeholder="Zona de interés / propiedad"
                className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-base font-medium text-black outline-none placeholder:text-black/35 focus:border-black/30"
              />
            </div>

            <button className="mt-6 rounded-full bg-black px-7 py-4 text-base font-bold text-white transition hover:opacity-90">
              Continuar
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
