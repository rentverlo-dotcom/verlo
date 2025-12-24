'use client';

import { useState } from 'react';

type Role = 'tenant' | 'owner';

export default function Page() {
  const [role, setRole] = useState<Role | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // mock global (después DB)
  const [data, setData] = useState<any[]>([]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = Object.fromEntries(new FormData(e.currentTarget));
    const payload = { role, ...formData };

    setData((prev) => [...prev, payload]);
    setSubmitted(true);

    console.log('NUEVO REGISTRO:', payload);
    console.log('DATA ACTUAL:', [...data, payload]);
  }

  function reset() {
    setRole(null);
    setSubmitted(false);
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-2xl space-y-10">

        {!role && (
          <>
            <h1 className="text-4xl font-bold text-center">
              Plataforma de Alquiler Inteligente
            </h1>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setRole('tenant')}
                className="p-6 border border-white/20 rounded-xl hover:bg-white hover:text-black transition"
              >
                Soy Inquilino
              </button>

              <button
                onClick={() => setRole('owner')}
                className="p-6 border border-white/20 rounded-xl hover:bg-white hover:text-black transition"
              >
                Soy Propietario
              </button>
            </div>
          </>
        )}

        {role && !submitted && (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 border border-white/20 rounded-xl p-8"
          >
            <h2 className="text-2xl font-bold">
              Registro {role === 'tenant' ? 'Inquilino' : 'Propietario'}
            </h2>

            <input
              name="name"
              required
              placeholder="Nombre"
              className="w-full p-3 bg-black border border-white/20 rounded"
            />

            <input
              name="email"
              type="email"
              required
              placeholder="Email"
              className="w-full p-3 bg-black border border-white/20 rounded"
            />

            <input
              name="zona"
              required
              placeholder="Zona"
              className="w-full p-3 bg-black border border-white/20 rounded"
            />

            {role === 'tenant' && (
              <input
                name="precio_max"
                placeholder="Precio máximo"
                className="w-full p-3 bg-black border border-white/20 rounded"
              />
            )}

            {role === 'owner' && (
              <input
                name="precio"
                placeholder="Precio de la propiedad"
                className="w-full p-3 bg-black border border-white/20 rounded"
              />
            )}

            <button
              type="submit"
              className="w-full p-4 bg-white text-black font-bold rounded hover:opacity-90"
            >
              Enviar
            </button>

            <button
              type="button"
              onClick={reset}
              className="w-full text-sm opacity-60 hover:opacity-100"
            >
              Volver
            </button>
          </form>
        )}

        {submitted && (
          <div className="text-center space-y-6 border border-white/20 rounded-xl p-10">
            <h2 className="text-2xl font-bold">Registro recibido</h2>

            <p className="opacity-70">
              Cuando exista un match compatible, el sistema notificará a ambas partes.
            </p>

            <button
              onClick={reset}
              className="mt-4 px-6 py-3 border border-white/20 rounded hover:bg-white hover:text-black"
            >
              Volver al inicio
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
