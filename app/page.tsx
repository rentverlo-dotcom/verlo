export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030712] text-white">

      {/* BACKGROUND GLOWS */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[10%] top-[10%] h-[400px] w-[400px] rounded-full bg-indigo-600/20 blur-[140px]" />
        <div className="absolute right-[10%] bottom-[10%] h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[160px]" />
      </div>

      {/* HERO */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-32 text-center">
        <span className="mb-6 inline-flex rounded-full border border-indigo-500/30 bg-indigo-500/10 px-5 py-2 text-xs font-bold tracking-widest text-indigo-300">
          BIENVENIDO A LA NUEVA ERA
        </span>

        <h1 className="mb-8 max-w-5xl text-5xl font-extrabold tracking-tight md:text-7xl xl:text-8xl">
          Alquila con{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            libertad total.
          </span>
        </h1>

        <p className="mb-12 max-w-3xl text-lg leading-relaxed text-slate-400 md:text-xl">
          Adiós a la burocracia, los depósitos infinitos y los intermediarios.
          Hemos reinventado el acceso a la vivienda para que sea{" "}
          <strong className="text-white">rápido, seguro e inspirador.</strong>
        </p>

        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <button className="rounded-2xl bg-white px-10 py-5 text-lg font-extrabold text-slate-900 transition hover:scale-105">
            Empieza Ahora
          </button>

          <button className="flex items-center gap-3 rounded-2xl border border-white/20 px-10 py-5 text-lg font-bold transition hover:bg-white/10">
            ▶ Ver Demo
          </button>
        </div>
      </section>

      {/* MOCKUP CARD */}
      <section className="relative mx-auto mt-24 max-w-5xl px-6">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex aspect-video items-center justify-center rounded-[24px] bg-slate-950">
            <div className="text-center">
              <div className="mb-6 flex justify-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-indigo-500/40 bg-indigo-500/20">
                  🔑
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/20">
                  🛡
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-purple-500/40 bg-purple-500/20">
                  ⚡
                </div>
              </div>

              <h3 className="mb-2 text-2xl font-bold">
                Tu próximo hogar está a 3 clicks
              </h3>
              <p className="text-slate-500">
                Inteligencia Artificial validando tu contrato en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VIAJE */}
      <section className="mx-auto max-w-7xl px-6 py-32">
        <div className="mb-20 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="mb-4 text-4xl font-extrabold md:text-6xl">
              El viaje de{" "}
              <span className="text-indigo-400">Punta a Punta.</span>
            </h2>
            <p className="max-w-xl text-lg text-slate-500">
              Desde la búsqueda hasta la entrega de llaves, Verlo es el único
              compañero que necesitas. Sin saltos, sin miedos.
            </p>
          </div>

          <div className="text-right">
            <div className="text-4xl font-bold text-cyan-400">100%</div>
            <div className="text-xs uppercase tracking-widest text-slate-500">
              Digital y Seguro
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: "01. Descubrimiento",
              text:
                "Filtros que entienden tu estilo de vida. No buscamos casas, buscamos el lugar donde vas a crear recuerdos.",
              icon: "🧭",
              color: "indigo",
            },
            {
              title: "02. Blindaje Legal",
              text:
                "Contratos inteligentes que protegen a ambas partes por igual. Firma desde tu sofá con validez jurídica.",
              icon: "📄",
              color: "purple",
            },
            {
              title: "03. Evolución",
              text:
                "Pagos automatizados, gestión de reparaciones y renovación con un click. El alquiler se vuelve invisible.",
              icon: "✨",
              color: "cyan",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-[36px] border border-white/10 bg-white/5 p-10 backdrop-blur-xl transition hover:-translate-y-2"
            >
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                {c.icon}
              </div>
              <h3 className="mb-4 text-2xl font-bold italic">{c.title}</h3>
              <p className="mb-6 text-slate-400">{c.text}</p>
              <div className="h-1 w-12 rounded-full bg-indigo-400" />
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-5xl px-6 pb-32">
        <div className="relative rounded-[56px] border border-white/10 bg-white/5 p-16 text-center backdrop-blur-xl md:p-24">
          <h2 className="mb-8 text-4xl font-extrabold md:text-6xl">
            ¿Listo para tu{" "}
            <span className="italic text-indigo-400">nuevo comienzo?</span>
          </h2>

          <p className="mx-auto mb-12 max-w-2xl text-lg text-slate-400">
            Únete a miles de personas que ya dejaron atrás las complicaciones.
            El hogar de tus sueños no debería ser una pesadilla legal.
          </p>

          <button className="rounded-3xl bg-indigo-600 px-14 py-6 text-2xl font-black transition hover:scale-110">
            QUIERO EMPEZAR HOY
          </button>
        </div>
      </section>
    </main>
  );
}

