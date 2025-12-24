'use client'

import { useEffect } from 'react'
import Head from 'next/head'

export default function Home() {
  useEffect(() => {
    const AOS = require('aos')
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
    })

    const handler = (e: MouseEvent) => {
      const moveX = (e.clientX - window.innerWidth / 2) * 0.01
      const moveY = (e.clientY - window.innerHeight / 2) * 0.01
      const bg = document.querySelector('.glow-bg') as HTMLElement
      if (bg) bg.style.transform = `translate(${moveX}px, ${moveY}px)`
    }

    document.addEventListener('mousemove', handler)
    return () => document.removeEventListener('mousemove', handler)
  }, [])

  return (
    <>
      <Head>
        <title>Verlo | El Futuro del Alquiler</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          rel="stylesheet"
        />
        <link
          href="https://unpkg.com/aos@2.3.1/dist/aos.css"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;400;700;800&display=swap');
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: #030712;
            color: white;
          }
        `}</style>
      </Head>

      <div className="glow-bg fixed inset-0 -z-10"></div>

      {/* NAV */}
      <nav className="fixed w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center glass px-6 py-3 rounded-2xl">
          <div className="text-2xl font-extrabold tracking-tighter">
            VERLO<span className="text-cyan-400">_</span>
          </div>
          <div className="hidden md:flex space-x-8 text-sm font-medium">
            <a href="#experiencia">Experiencia</a>
            <a href="#proceso">El Viaje</a>
            <a href="#">Seguridad</a>
          </div>
          <button className="bg-indigo-600 px-5 py-2 rounded-xl font-bold">
            Lanzar App
          </button>
        </div>
      </nav>

      {/* HERO */}
      <main className="pt-32 min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-center" data-aos="fade-up">
          <span className="inline-block px-4 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold mb-6">
            Bienvenido a la Nueva Era
          </span>

          <h1 className="text-6xl md:text-9xl font-extrabold mb-8">
            Alquila con <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              libertad total.
            </span>
          </h1>

          <p className="text-slate-400 text-xl max-w-3xl mx-auto mb-12">
            Adiós a la burocracia, los depósitos infinitos y los intermediarios.
            Hemos reinventado el acceso a la vivienda para que sea rápido,
            seguro e inspirador.
          </p>

          <div className="flex gap-6 justify-center">
            <button className="px-10 py-5 bg-white text-black rounded-2xl font-extrabold text-xl">
              Empieza Ahora
            </button>
            <button className="px-10 py-5 border border-white/20 rounded-2xl font-bold text-xl">
              <i className="fas fa-play mr-2" /> Ver Demo
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
