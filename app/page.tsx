'use client';

export default function Page() {
  return (
    <>
      {/* HEADER */}
      <header className="fixed top-0 z-50 w-full border-b border-neutral-800 bg-black/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          
          {/* LOGO (placeholder) */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-wide text-white">
              VERLO
            </span>
          </div>

          {/* NAV */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-300">
            <a href="#como-funciona" className="hover:text-white transition">
              Cómo funciona
            </a>
            <a href="#inquilinos" className="hover:text-white transition">
              Inquilinos
            </a>
            <a href="#propietarios" className="hover:text-white transition">
              Propietarios
            </a>
            <a href="#contrato" className="hover:text-white transition">
              Contrato digital
            </a>
          </nav>

          {/* ACTIONS */}
          <div className="flex items-center gap-3">
            <button className="text-sm text-neutral-300 hover:text-white transition">
              Ingresar
            </button>
            <button className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200 transition">
              Comenzar
            </button>
          </div>
        </div>
      </header>

      {/* PAGE OFFSET */}
      <main className="pt-24">
        {/* HERO PLACEHOLDER */}
        <section className="mx-auto max-w-7xl px-6 py-24">
          <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-white">
            Plataforma de matching inmobiliario
          </h1>
          <p className="mt-6 max-w-2xl text-neutral-400">
            Inquilinos y propietarios se registran, matchean y firman contratos
            digitales en un solo flujo.
          </p>
        </section>
      </main>
    </>
  );
}

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
