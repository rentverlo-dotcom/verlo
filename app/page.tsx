'use client';

import { useState } from 'react';

export default function Page() {
  const [role, setRole] = useState<null | 'tenant' | 'owner'>(null);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* ================= HEADER ================= */}
      <header style={{ padding: '24px 40px', borderBottom: '1px solid #eee' }}>
        <strong>VERLO</strong>
      </header>

      {/* ================= HERO ================= */}
      <section style={{ padding: '80px 40px', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 42, marginBottom: 16 }}>
          Matching inteligente entre inquilinos y propietarios
        </h1>

        <p style={{ fontSize: 18, color: '#555', marginBottom: 40 }}>
          Publicá, buscá y cerrá contratos sin intermediarios innecesarios.
        </p>

        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={() => setRole('tenant')}>Soy Inquilino</button>
          <button onClick={() => setRole('owner')}>Soy Propietario</button>
        </div>
      </section>

      {/* ================= COMO FUNCIONA ================= */}
      <section style={{ padding: '60px 40px', background: '#fafafa' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2>Cómo funciona VERLO</h2>
          <ol>
            <li>Cargás tu perfil o propiedad</li>
            <li>El sistema analiza compatibilidad</li>
            <li>Cuando hay match, se habilita contacto y contrato digital</li>
          </ol>
        </div>
      </section>

      {/* ================= DOBLE ENTRADA ================= */}
      <section style={{ padding: '60px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          <div>
            <h3>Inquilinos</h3>
            <p>Buscá vivienda según tus condiciones reales.</p>
            <ul>
              <li>Zona y presupuesto</li>
              <li>Condiciones y garantía</li>
              <li>Matches reales</li>
            </ul>
          </div>

          <div>
            <h3>Propietarios</h3>
            <p>Publicá propiedades y recibí postulantes filtrados.</p>
            <ul>
              <li>Datos de la propiedad</li>
              <li>Requisitos claros</li>
              <li>Menos tiempo perdido</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ================= FORMULARIOS ================= */}
      {role && (
        <section style={{ padding: '60px 40px', background: '#fafafa' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2>
              Formulario {role === 'tenant' ? 'Inquilino' : 'Propietario'}
            </h2>

            <form style={{ display: 'grid', gap: 12 }}>
              <input placeholder="Nombre completo" />
              <input placeholder="Email" />
              <input placeholder="Teléfono" />

              {role === 'tenant' ? (
                <>
                  <input placeholder="Zona de interés" />
                  <input placeholder="Presupuesto máximo" />
                  <input placeholder="Tipo de garantía" />
                </>
              ) : (
                <>
                  <input placeholder="Dirección de la propiedad" />
                  <input placeholder="Precio" />
                  <input placeholder="Requisitos" />
                </>
              )}

              <button type="button">
                Enviar para matching
              </button>
            </form>
          </div>
        </section>
      )}

      {/* ================= MATCH & CONTRATO ================= */}
      <section style={{ padding: '60px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2>Matching y contrato digital</h2>
          <p>
            Cuando un perfil y una propiedad son compatibles:
          </p>
          <ul>
            <li>Se notifica al inquilino</li>
            <li>Se notifica al propietario</li>
            <li>El sistema avisa al administrador</li>
            <li>Se habilita contrato digital</li>
          </ul>
        </div>
      </section>

      {/* ================= CONFIANZA ================= */}
      <section style={{ padding: '60px 40px', background: '#fafafa' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2>Transparencia y trazabilidad</h2>
          <p>
            Cada acción queda registrada. Los contratos se generan con datos reales
            y el proceso es auditable.
          </p>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer style={{ padding: '40px', borderTop: '1px solid #eee' }}>
        <small>VERLO · Plataforma de matching inmobiliario</small>
      </footer>

    </main>
  );
}
