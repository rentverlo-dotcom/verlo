'use client'

import { useEffect } from 'react'

export default function Page() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const x = (e.clientX - window.innerWidth / 2) * 0.01
      const y = (e.clientY - window.innerHeight / 2) * 0.01
      const bg = document.querySelector('.glow-bg') as HTMLElement
      if (bg) bg.style.transform = `translate(${x}px, ${y}px)`
    }
    document.addEventListener('mousemove', handler)
    return () => document.removeEventListener('mousemove', handler)
  }, [])

  return (
    <>
      <div className="glow-bg" />

      {/* NAV */}
      <nav className="fixed w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto glass px-6 py-3 rounded-2xl flex justify-between items-center">
          <div className="text-2xl font-extrabold tracking-tighter">
            VERLO<span className="text-cyan-400">_</span>
          </div>

          <div className="hidden md:flex gap-8 text-sm font-medium">
            <a className="hover:text-cyan-400 transition">Experiencia</a>
            <a className="hover:text-cyan-400 transition">El Viaje</a>
            <a className="hover:text-cyan-400 transition">Seguridad</a>
          </div>

          <button className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30">
            Lanzar App
          </button>
        </div>
      </nav>

      {/* HERO */}
      <main className="min-h-screen pt-32 flex flex-col items-center justify-center text-center px-6">
        <span className="mb-6 px-4 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold tracking-widest">
          BIENVENIDO A LA NUEVA ERA
        </span>

        <h1 className="text-6xl md:text-9xl font-extrabold tracking-tighter leading-tight mb-8">
          Alquila con <br />
          <span className="text-gradient">libertad total.</span>
        </h1>

        <p className="text-slate-400 text-xl md:text-2xl max-w-3xl mb-12 font-light">
          Adiós a la burocracia, los depósitos infinitos y los intermediarios.
          Hemos reinventado el acceso a la vivienda para que sea{' '}
          <strong>rápido, seguro e inspirador.</strong>
        </p>

        <div className="flex flex-col sm:flex-row gap-6">
          <button className="btn-main btn-main-white">
            Empieza Ahora
          </button>

          <button className="btn-main btn-main-glass">
            ▶ Ver Demo
          </button>
        </div>
      </main>
    </>
  )
}
