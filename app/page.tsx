'use client'

import { useEffect } from 'react'

export default function Page() {
  useEffect(() => {
    // @ts-ignore
    if (window.AOS) {
      // @ts-ignore
      window.AOS.init({
        duration: 1000,
        once: true,
        offset: 100,
      })
    }

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
      {/* HEAD */}
      <script src="https://cdn.tailwindcss.com"></script>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
      <link
        rel="stylesheet"
        href="https://unpkg.com/aos@2.3.1/dist/aos.css"
      />
      <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>

      {/* STYLES */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;400;700;800&display=swap');

        :root {
          --primary: #6366f1;
          --secondary: #a855f7;
          --accent: #22d3ee;
          --bg: #030712;
        }

        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background-color: var(--bg);
          color: #ffffff;
          overflow-x: hidden;
        }

        .glow-bg {
          position: fixed;
          inset: 0;
          z-index: -1;
          background:
            radial-gradient(circle at 20% 30%, rgba(99,102,241,.15), transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(168,85,247,.15), transparent 40%);
        }

        .glass {
          background: rgba(255,255,255,.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,.1);
          transition: all .4s cubic-bezier(.175,.885,.32,1.275);
        }

        .glass:hover {
          background: rgba(255,255,255,.07);
          border-color: rgba(255,255,255,.2);
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0,0,0,.4);
        }

        .text-gradient {
          background: linear-gradient(to right,#6366f1,#a855f7,#22d3ee);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .floating {
          animation: floating 3s ease-in-out infinite;
        }

        @keyframes floating {
          0%,100% { transform: translateY(0) }
          50% { transform: translateY(-15px) }
        }

        .step-card {
          border-left: 2px solid transparent;
          background: linear-gradient(90deg, rgba(99,102,241,.05), transparent);
        }

        .step-card:hover {
          border-left-color: var(--accent);
        }
      `}</style>

      <div className="glow-bg" />

      {/* NAV */}
      <nav className="fixed w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center glass px-6 py-3 rounded-2xl">
          <div className="text-2xl font-extrabold">VERLO<span className="text-cyan-400">_</span></div>
          <button className="bg-indigo-600 px-5 py-2 rounded-xl font-bold">
            Lanzar App
          </button>
        </div>
      </nav>

      {/* HERO */}
      <main className="pt-32 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-6xl md:text-9xl font-extrabold mb-8">
          Alquila con <span className="text-gradient">libertad total.</span>
        </h1>
        <p className="text-slate-400 text-xl max-w-3xl mb-12">
          Rápido, seguro y sin intermediarios.
        </p>
        <button className="bg-white text-black px-10 py-5 rounded-2xl font-extrabold text-xl">
          Empezar ahora
        </button>
      </main>
    </>
  )
}
