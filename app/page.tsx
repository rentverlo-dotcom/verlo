'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type View = 'home' | 'tenant' | 'owner' | 'done';

export default function Page() {
  const [view, setView] = useState<View>('home');
  const [loading, setLoading] = useState(false);

  const [tenant, setTenant] = useState({
    name: '',
    email: '',
    budget_min: 0,
    budget_max: 0,
  });

  const [owner, setOwner] = useState({
    name: '',
    email: '',
    price: 0,
  });

  async function submitTenant() {
    setLoading(true);

    const { data: tenantRow, error } = await supabase
      .from('tenants')
      .insert(tenant)
      .select()
      .single();

    if (!error && tenantRow) {
      const { data: owners } = await supabase
        .from('owners')
        .select('*')
        .gte('price', tenant.budget_min)
        .lte('price', tenant.budget_max);

      if (owners && owners.length > 0) {
        await supabase.from('matches').insert(
          owners.map((o) => ({
            tenant_id: tenantRow.id,
            owner_id: o.id,
            status: 'pending',
          }))
        );
      }
    }

    setLoading(false);
    setView('done');
  }

  async function submitOwner() {
    setLoading(true);
    await supabase.from('owners').insert(owner);
    setLoading(false);
    setView('done');
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      {view === 'home' && (
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <h1 className="text-5xl font-bold">VERLO</h1>
          <p>Matching automático entre inquilinos y propietarios</p>

          <div className="grid md:grid-cols-2 gap-6">
            <button
              className="border p-6"
              onClick={() => setView('tenant')}
            >
              Soy Inquilino
            </button>

            <button
              className="border p-6"
              onClick={() => setView('owner')}
            >
              Soy Propietario
            </button>
          </div>
        </div>
      )}

      {view === 'tenant' && (
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">Formulario Inquilino</h2>

          <input
            className="w-full p-3 bg-black border"
            placeholder="Nombre"
            onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
          />
          <input
            className="w-full p-3 bg-black border"
            placeholder="Email"
            onChange={(e) => setTenant({ ...tenant, email: e.target.value })}
          />
          <input
            className="w-full p-3 bg-black border"
            type="number"
            placeholder="Presupuesto mínimo"
            onChange={(e) =>
              setTenant({ ...tenant, budget_min: Number(e.target.value) })
            }
          />
          <input
            className="w-full p-3 bg-black border"
            type="number"
            placeholder="Presupuesto máximo"
            onChange={(e) =>
              setTenant({ ...tenant, budget_max: Number(e.target.value) })
            }
          />

          <button
            disabled={loading}
            onClick={submitTenant}
            className="w-full border p-4"
          >
            {loading ? 'Procesando...' : 'Enviar'}
          </button>

          <button onClick={() => setView('home')} className="underline">
            Volver
          </button>
        </div>
      )}

      {view === 'owner' && (
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">Formulario Propietario</h2>

          <input
            className="w-full p-3 bg-black border"
            placeholder="Nombre"
            onChange={(e) => setOwner({ ...owner, name: e.target.value })}
          />
          <input
            className="w-full p-3 bg-black border"
            placeholder="Email"
            onChange={(e) => setOwner({ ...owner, email: e.target.value })}
          />
          <input
            className="w-full p-3 bg-black border"
            type="number"
            placeholder="Precio del alquiler"
            onChange={(e) =>
              setOwner({ ...owner, price: Number(e.target.value) })
            }
          />

          <button
            disabled={loading}
            onClick={submitOwner}
            className="w-full border p-4"
          >
            {loading ? 'Procesando...' : 'Publicar'}
          </button>

          <button onClick={() => setView('home')} className="underline">
            Volver
          </button>
        </div>
      )}

      {view === 'done' && (
        <div className="max-w-xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Listo</h2>
          <p>
            Si hay match, el sistema registra la relación y notifica.
          </p>
          <button
            className="border px-6 py-3"
            onClick={() => setView('home')}
          >
            Volver al inicio
          </button>
        </div>
      )}
    </main>
  );
}
