'use client'

import { useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'

export default function Page() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 80,
    })

    const handler = (e: MouseEvent) => {
      const moveX = (e.clientX - window.innerWidth / 2) * 0.02
      const moveY = (e.clientY - window.innerHeight / 2) * 0.02
      const bg = document.querySelector('.glow-bg') as HTMLElement
      if (bg) bg.style.transform = `translate(${moveX}px, ${moveY}px)`
    }

    document.addEventListener('mousemove', handler)
    return () => document.removeEventListener('mousemove', handler)
  }, [])

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="glow-bg" />

      {/* NAV */}
      <nav className="flex items-center justify-between px-8 py-6">
        <div className="text-xl font-bold">VERLO_</div>
        <div className="flex gap-8 text-sm text-gray-300">
          <a href="#">Experiencia</a>
          <a href="#">El Viaje</a>
          <a href="#">Seguridad</a>
        </div>
        <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500">
          Lanzar App
        </button>
      </nav>

      {/* HERO */}
      <section className="mx-auto mt-28 max-w-5xl px-6 text-center">
        <div
          data-aos="fade-down"
          className="mx-auto mb-6 inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1 text-xs tracking-wide text-indigo-300"
        >
          BIENVENIDO A LA NUEVA ERA
        </div>

        <h1
          data-aos="fade-up"
          className="text-5xl font-extrabold leading-tight md:text-7xl"
        >
          Alquila con{' '}
          <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            libertad total
          </span>
          .
        </h1>

        <p
          data-aos="fade-up"
          data-aos-delay="150"
          className="mx-auto mt-6 max-w-2xl text-gray-300"
        >
          Adiós a la burocracia, los depósitos infinitos y los intermediarios.
          Hemos reinventado el acceso a la vivienda para que sea rápido,
          seguro e inspirador.
        </p>

        <div
          data-aos="fade-up"
          data-aos-delay="300"
          className="mt-10 flex justify-center gap-4"
        >
          <button className="rounded-xl bg-white px-6 py-3 font-semibold text-black hover:bg-gray-200">
            Empieza Ahora
          </button>
          <button className="rounded-xl border border-white/20 px-6 py-3 text-white hover:bg-white/10">
            Ver Demo
          </button>
        </div>
      </section>
    </main>
  )
}
