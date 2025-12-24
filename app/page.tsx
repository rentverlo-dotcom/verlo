'use client';

import { useState } from 'react';

export default function Page() {
  const [role, setRole] = useState<'tenant' | 'owner' | null>(null);

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="fixed top-0 z-50 w-full border-b border-neutral-800 bg-black/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* LOGO */}
          <div className="text-lg font-semibold tracking-wide text-white">
            VERLO
          </div>

          {/* NAV */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-300">
            <a href="#como-funciona" className="hover:text-white">Cómo funciona</a>
            <a href="#inquilinos" className="hover:text-white">Inquilinos</a>
            <a href="#propietarios" className="hover:text-white">Propietarios</a>
            <a href="#contrato" className="hover:text-white">Contrato digital</a>
          </nav>

          {/* ACTIONS */}
          <div className="flex items-center gap-3">
            <button className="text-sm text-neutral-300 hover:text-white">
              Ingresar
            </button>
            <button className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200">
              Comenzar
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="pt-24 text-white">

        {/* ================= HERO ================= */}
        <section className="mx-auto max-w-7xl px-6 py-24">
          <h1 className="max-w-3xl text-5xl font-semibold leading-tight">
            Matching inteligente entre inquilinos y propietarios
          </h1>
          <p className="mt-6 max-w-2xl text-neutral-400">
            Registrate, matcheá perfiles reales y cerrá contratos digitales sin
            intermediarios innecesarios.
          </p>

          <div className="mt-10 flex gap-4">
            <button
              onClick={() => setRole('tenant')}
              className="rounded-md bg-white px-6 py-3 text-black font-medium"
            >
              Soy Inquilino
            </button>
            <button
              onClick={() => setRole('owner')}
              className="rounded-md border border-white/30 px-6 py-3"
            >
              Soy Propietario
            </button>
          </div>
        </section>

        {/* ================= COMO FUNCIONA ================= */}
        <section id="como-funciona" className="bg-neutral-950 py-20">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-3xl font-semibold mb-6">Cómo funciona VERLO</h2>
            <ol className="list-decimal pl-6 space-y-2 text-neutral-300">
              <li>Inquilinos y propietarios cargan su información real</li>
              <li>El sistema analiza compatibilidad</li>
              <li>Cuando hay match, se habilita contacto y contrato digital</li>
            </ol>
          </div>
        </section>

        {/* ================= DOBLE ENTRADA ================= */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-6 grid grid-cols-1 md:grid-cols-2 gap-16">
            <div id="inquilinos">
              <h3 className="text-2xl font-semibold mb-4">Inquilinos</h3>
              <p className="text-neutral-400 mb-4">
                Buscá vivienda según tus condiciones reales.
              </p>
              <ul className="list-disc pl-5 text-neutral-300 space-y-1">
                <li>Zona y presupuesto</li>
                <li>Garantía y requisitos</li>
                <li>Matches reales</li>
              </ul>
            </div>

            <div id="propietarios">
              <h3 className="text-2xl font-semibold mb-4">Propietarios</h3>
              <p className="text-neutral-400 mb-4">
                Publicá propiedades y recibí postulantes filtrados.
              </p>
              <ul className="list-disc pl-5 text-neutral-300 space-y-1">
                <li>Datos claros de la propiedad</li>
                <li>Requisitos definidos</li>
                <li>Ahorro de tiempo</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ================= FORMULARIOS ================= */}
        {role && (
          <section className="bg-neutral-950 py-20">
            <div className="mx-auto max-w-xl px-6">
              <h2 className="text-3xl font-semibold mb-6">
                Formulario {role === 'tenant' ? 'Inquilino' : 'Propietario'}
              </h2>

              <form className="grid gap-4">
                <input className="rounded-md bg-black border border-neutral-700 px-4 py-3" placeholder="Nombre completo" />
                <input className="rounded-md bg-black border border-neutral-700 px-4 py-3" placeholder="Email" />
                <input className="rounded-md bg-black border border-neutral-700 px-4 py-3" placeholder="Teléfono" />

                {role === 'tenant' ? (
                  <>
                    <input className="rounded-md bg-black border border-neutral-700 px-4 py-3" placeholder="Zona de interés" />
                    <input className="rounded-md bg-black border border-neutral-700 px-4 py-3" placeholder="Presupuesto máximo" />
                    <input className="rounded-md bg-black border border-neutral-700 px-4 py-3" placeholder="Tipo de garantía" />
                  </>
                ) : (
                  <>
                    <input className="rounded-md bg-black border border-neutral-700 px-4 py-3" placeholder="Dirección de la propiedad" />
                    <input className="rounded-md bg-black border border-neutral-700 px-4 py-3" placeholder="Precio" />
                    <input className="rounded-md bg-black border border-neutral-700 px-4 py-3" placeholder="Requisitos" />
                  </>
                )}

                <button
                  type="button"
                  className="mt-4 rounded-md bg-white py-3 text-black font-medium"
                >
                  Enviar para matching
                </button>
              </form>
            </div>
          </section>
        )}

        {/* ================= MATCH & CONTRATO ================= */}
        <section id="contrato" className="py-20">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-3xl font-semibold mb-6">
              Matching y contrato digital
            </h2>
            <ul className="list-disc pl-6 text-neutral-300 space-y-2">
              <li>Notificación automática a inquilino y propietario</li>
              <li>Aviso al administrador</li>
              <li>Generación de contrato digital</li>
              <li>Trazabilidad completa del proceso</li>
            </ul>
          </div>
        </section>

        {/* ================= FOOTER ================= */}
        <footer className="border-t border-neutral-800 py-10 text-center text-neutral-400">
          <small>VERLO · Plataforma de matching inmobiliario</small>
        </footer>

      </main>
    </>
  );
}
