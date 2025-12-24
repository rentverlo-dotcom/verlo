export default function Home() {
  return (
    <>
      <div className="glow-bg" />

      {/* NAV */}
      <nav className="fixed w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center glass px-6 py-3 rounded-2xl">
          <div className="text-2xl font-extrabold tracking-tighter">
            VERLO<span className="text-cyan-400">_</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm">
            <a>Experiencia</a>
            <a>El Viaje</a>
            <a>Seguridad</a>
          </div>
          <button className="bg-indigo-600 px-5 py-2 rounded-xl font-bold">
            Lanzar App
          </button>
        </div>
      </nav>

      {/* HERO */}
      <main className="pt-40 text-center px-6">
        <span className="inline-block mb-6 px-4 py-1 text-xs rounded-full border border-indigo-500/30 bg-indigo-500/10">
          Bienvenido a la Nueva Era
        </span>

        <h1 className="text-6xl md:text-8xl font-extrabold mb-8">
          Alquila con <br />
          <span className="text-gradient">libertad total.</span>
        </h1>

        <p className="max-w-3xl mx-auto text-slate-400 text-xl mb-12">
          Adiós a la burocracia, los depósitos infinitos y los intermediarios.
          <br />
          <strong className="text-white">
            Rápido, seguro e inspirador.
          </strong>
        </p>

        <div className="flex justify-center gap-6">
          <button className="bg-white text-black px-10 py-4 rounded-2xl font-extrabold">
            Empieza Ahora
          </button>
          <button className="glass px-10 py-4 rounded-2xl font-bold">
            <i className="fas fa-play mr-2" />
            Ver Demo
          </button>
        </div>
      </main>
    </>
  );
}
