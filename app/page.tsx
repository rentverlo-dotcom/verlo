'use client'

export default function Page() {
  return (
    <main className="min-h-screen bg-[#070B18] text-white relative overflow-hidden">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-200px] top-[-200px] h-[500px] w-[500px] rounded-full bg-purple-600/30 blur-[180px]" />
        <div className="absolute right-[-200px] bottom-[-200px] h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-[180px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-10 py-6">
        <div className="text-xl font-bold tracking-tight">
          VERLO<span className="text-cyan-400">_</span>
        </div>

        <nav className="hidden md:flex gap-10 text-sm text-white/80">
          <a href="#" className="hover:text-white">Experiencia</a>
          <a href="#" className="hover:text-white">El Viaje</a>
          <a href="#" className="hover:text-white">Seguridad</a>
        </nav>

        <button className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-5 py-2 text-sm font-semibold text-white shadow-lg">
          Lanzar App
        </button>
      </header>

      {/* Hero */}
      <section className="relative z-10 px-10 pt-28 max-w-5xl">
        <div className="mb-6 inline-block rounded-full border border-white/20 px-4 py-1 text-xs tracking-wide text-white/70">
          BIENVENIDO A LA NUEVA ERA
        </div>

        <h1 className="text-6xl md:text-7xl font-extrabold leading-tight tracking-tight">
          Alquila con <br />
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            libertad total.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-base md:text-lg text-white/70">
          Adiós a la burocracia, los depósitos infinitos y los intermediarios.
          Hemos reinventado el acceso a la vivienda para que sea{' '}
          <span className="text-white font-medium">
            rápido, seguro e inspirador.
          </span>
        </p>

        <div className="mt-10 flex gap-4">
          <button className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black">
            Empieza ahora
          </button>
          <button className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white">
            Ver demo
          </button>
        </div>
      </section>
    </main>
  )
}
