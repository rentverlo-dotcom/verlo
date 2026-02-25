'use client'
import HeroCarousel from '@/components/HeroCarousel'

export default function HomePage() {
  return (
    <>

      {/* HERO */}
      <section
        style={{
          paddingTop: "120px",
          paddingBottom: "10px",  
        }}
      >
        <div className="container" style={{ maxWidth: 1100 }}>

          <h1
            style={{
              fontSize: "72px",
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-1.5px",
              margin: 0,
              color: "#0f172a"
            }}
          >
            Alquilá sin inmobiliarias.
          </h1>

          <p
            style={{
              fontSize: "20px",
              maxWidth: "680px",
              marginTop: "24px",
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            Alquiler directo, sin inmobiliarias ni comisiones, con un proceso simple
            y transparente.
          </p>

          <button
            style={{
              marginTop: "36px",
              padding: "14px 28px",
              borderRadius: "999px",
              border: "none",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
              background: "linear-gradient(90deg, #ff2d7a, #ff4aa6)",
              color: "#fff",
              boxShadow: "0 10px 30px rgba(255,45,122,0.25)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)"
              e.currentTarget.style.boxShadow = "0 14px 40px rgba(255,45,122,0.35)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(255,45,122,0.25)"
            }}
          >
            Empezar ahora
          </button>

        </div>
      </section>

      <HeroCarousel />
      
      {/* HERO BRIDGE */}
      <section>
        <div className="hero-bridge">

          <div className="card">
            <strong>Sin inmobiliarias</strong>
            <p>
              Alquilá de forma directa, sin intermediarios ni costos ocultos.
            </p>
          </div>

          <div className="card">
            <strong>Matching inteligente</strong>
            <p>
              Menos vueltas: conectamos perfiles realmente compatibles.
            </p>
          </div>

          <div className="card">
            <strong>Contrato digital</strong>
            <p>
              Cerrá el acuerdo con un proceso claro y seguro desde el inicio.
            </p>
          </div>

        </div>
      </section>

      <section
        style={{
          padding: "80px 24px",
        }}
      >
        <div className="container">
          <h2 className="section-title">¿Qué es VERLO?</h2>

          <p style={{ maxWidth: "720px", fontSize: "18px", lineHeight: 1.6 }}>
            VERLO es una plataforma de alquiler directo que conecta inquilinos y
            propietarios compatibles, sin intermediarios y sin comisiones
            innecesarias.
          </p>

          <p
            style={{
              maxWidth: "720px",
              fontSize: "18px",
              lineHeight: 1.6,
              marginTop: "8px",
              opacity: 0.85,
            }}
          >
            En lugar de buscar entre cientos de avisos o depender de una inmobiliaria,
            VERLO analiza perfiles y propiedades para generar coincidencias reales y
            facilitar acuerdos claros y seguros.
          </p>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section
        style={{
          padding: "100px 24px",
          background: "rgba(255,255,255,0.02)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="container">
          <h2 className="section-title">Cómo funciona VERLO</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "32px",
              marginTop: "48px",
            }}
          >
            <div className="card">
              <h3>1. Cargás tu info</h3>
              <p>
                Inquilinos cuentan qué buscan. Propietarios publican su
                propiedad y requisitos.
              </p>
            </div>

            <div className="card">
              <h3>2. Analizamos compatibilidad</h3>
              <p>
                VERLO cruza perfiles y propiedades para encontrar coincidencias
                reales.
              </p>
            </div>

            <div className="card">
              <h3>3. Te avisamos</h3>
              <p>
                Cuando hay un match, ambas partes reciben la notificación para
                avanzar.
              </p>
            </div>

            <div className="card">
              <h3>4. Cerrás con contrato</h3>
              <p>
                Si hay acuerdo, se genera el contrato digital de forma simple y
                segura.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* POR QUE VERLO */}
      <section
        style={{
          padding: "100px 24px",
          background: "rgba(255,255,255,0.03)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="container">
          <h2 className="section-title">¿Por qué usar VERLO?</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "32px",
              marginTop: "48px",
              maxWidth: "900px",
            }}
          >
            <div className="card">
              <h3>Sin comisiones</h3>
              <p>
                Alquilá sin pagar honorarios de inmobiliaria ni costos ocultos.
                VERLO elimina intermediarios innecesarios.
              </p>
            </div>

            <div className="card">
              <h3>Menos tiempo perdido</h3>
              <p>
                Nada de llamadas eternas ni visitas que no encajan.
                El sistema busca compatibilidad real antes del contacto.
              </p>
            </div>

            <div className="card">
              <h3>Transparencia para ambos</h3>
              <p>
                Inquilinos y propietarios avanzan con la misma información
                desde el primer momento.
              </p>
            </div>

            <div className="card">
              <h3>Contrato digital</h3>
              <p>
                Cuando hay acuerdo, el contrato se genera de forma simple y clara,
                reduciendo errores y malentendidos.
              </p>
            </div>
          </div>

          <div style={{ marginTop: "48px" }}>
            <button className="button">
              Ver cómo empezar
            </button>
          </div>
        </div>
      </section>

      {/* TRANSPARENCIA */}
      <section
        id="transparencia"
        style={{
          padding: "80px 24px",
        }}
      >
        <div className="container">
          <div
            className="card"
            style={{
              maxWidth: "900px",
              margin: "0 auto",
            }}
          >
            <h2 className="section-title">Transparencia ante todo</h2>

            <p style={{ fontSize: "18px", lineHeight: 1.6 }}>
              VERLO elimina la ineficiencia en el mundo de alquileres.
            </p>

            <p
              style={{
                fontSize: "18px",
                lineHeight: 1.6,
                marginTop: "16px",
                opacity: 0.85,
              }}
            >
              Unimos inquilinos y propietarios según sus preferencias y los ponemos en contacto. Los ayudamos a coordinar visitas
              y si se ponen de acuerdo y quieren avanzar, pueden firmar su contrato electrónicamente en VERLO.
              No solo les garantizamos seguirdad jurídica, sino que ademas valdiamos identidad sin excepción antes de que tomen contacto 
              telefónico y realicen visitas.
            </p>

            <p
              style={{
                fontSize: "18px",
                lineHeight: 1.6,
                marginTop: "16px",
                opacity: 0.85,
              }}
            >
              Cuánto costaba firmar un contrato de alquiler cuando lo hacía una inmobiliaria? Y cuánto tardaban en atender tus necesidades? 
              VERLO hace todo en tiempo real, sin demoras, vía Whatsapp y con seguridad garantizada. Y, además, muchísimo más barato.
            </p>
          </div>
        </div>
      </section>

      {/* QUE PASA DESPUES */}
      <section
        style={{
          padding: "80px 24px",
          background: "rgba(255,255,255,0.02)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="container">
          <h2 className="section-title">¿Qué pasa después de completar el formulario?</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "32px",
              marginTop: "40px",
              maxWidth: "900px",
            }}
          >
            <div className="card">
              <h3>Revisamos la información</h3>
              <p>
                VERLO analiza automáticamente los datos para encontrar coincidencias
                reales.
              </p>
            </div>

            <div className="card">
              <h3>Te avisamos si hay match</h3>
              <p>
                Solo te contactamos cuando existe compatibilidad entre ambas partes.
              </p>
            </div>

            <div className="card">
              <h3>Avanzás con seguridad</h3>
              <p>
                Si hay acuerdo, podés generar el contrato digital y seguir el proceso
                de forma clara.
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: "48px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button className="button">
              Completá tu perfil
            </button>
          </div>
        </div>
      </section>

      {/* FORMS */}
      <section
        id="forms"
        style={{
          paddingTop: "100px",
          paddingBottom: "140px",
        }}
      >
        <div className="container">
          <h2 className="section-title">Empezá ahora</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "32px",
              marginTop: "40px",
            }}
          >
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Soy inquilino</h3>
              <p>Encontrá propiedades compatibles con tu perfil.</p>
              <a href="/inquilino/registro">
                <button className="button">Buscar propiedades</button>
              </a>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>Soy propietario</h3>
              <p>Publicá tu propiedad y recibí inquilinos compatibles.</p>
              <a href="/propietario/publicar">
                <button className="button">Publicar propiedad</button>
              </a>
            </div>
          </div>
        </div>
      </section>

     {/* FOOTER */}
<footer
  style={{
    padding: "72px 24px 44px",
    borderTop: "1px solid rgba(2,6,23,0.08)",
    background:
      "radial-gradient(900px 500px at 15% 120%, rgba(236,72,153,0.18), transparent 60%), radial-gradient(900px 500px at 85% -10%, rgba(59,130,246,0.18), transparent 60%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  }}
>
  <div className="container" style={{ maxWidth: 1100 }}>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "28px",
        alignItems: "start",
        padding: "22px 22px",
        borderRadius: 22,
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(2,6,23,0.08)",
        boxShadow: "0 18px 55px rgba(2,6,23,0.08)",
      }}
    >
      {/* LEFT */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <strong
            style={{
              fontSize: "18px",
              letterSpacing: "0.6px",
              color: "#0f172a",
            }}
          >
            VERLO
          </strong>

          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: "6px 10px",
              borderRadius: 999,
              color: "#0f172a",
              background:
                "linear-gradient(90deg, rgba(236,72,153,0.18), rgba(59,130,246,0.18))",
              border: "1px solid rgba(2,6,23,0.08)",
            }}
          >
            Alquiler directo
          </span>
        </div>

        <p
          style={{
            marginTop: 10,
            color: "#475569",
            maxWidth: 520,
            lineHeight: 1.6,
            fontSize: 14,
          }}
        >
          Alquiler directo entre inquilinos y propietarios, sin intermediarios
          ni comisiones innecesarias.
        </p>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid rgba(2,6,23,0.10)",
              background: "rgba(255,255,255,0.65)",
              color: "#0f172a",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Empezar ahora
            <span style={{ opacity: 0.7 }}>→</span>
          </a>

          <a
            href="/#forms"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid rgba(236,72,153,0.35)",
              background:
                "linear-gradient(90deg, rgba(255,45,122,0.95), rgba(255,74,166,0.95))",
              color: "#fff",
              fontWeight: 800,
              fontSize: 13,
              textDecoration: "none",
              boxShadow: "0 14px 40px rgba(255,45,122,0.20)",
            }}
          >
            Publicar propiedad
          </a>
        </div>
      </div>

      {/* RIGHT */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto",
          gap: "10px 18px",
          alignContent: "start",
          justifyItems: "start",
          fontSize: 14,
        }}
      >
        {[
          { href: "/terminos", label: "Términos" },
          { href: "/privacidad", label: "Privacidad" },
          { href: "/contacto", label: "Contacto" },
          { href: "/#transparencia", label: "Transparencia" },
        ].map((l) => (
          <a
            key={l.href}
            href={l.href}
            style={{
              color: "#0f172a",
              opacity: 0.8,
              textDecoration: "none",
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1"
              e.currentTarget.style.borderColor = "rgba(2,6,23,0.10)"
              e.currentTarget.style.background = "rgba(255,255,255,0.55)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.8"
              e.currentTarget.style.borderColor = "transparent"
              e.currentTarget.style.background = "transparent"
            }}
          >
            {l.label}
          </a>
        ))}
      </div>
    </div>

    {/* BOTTOM */}
    <div
      style={{
        marginTop: 18,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        color: "#64748b",
        fontSize: 13,
        padding: "0 6px",
      }}
    >
      <span>© {new Date().getFullYear()} VERLO. Todos los derechos reservados.</span>
      <span style={{ opacity: 0.8 }}>Hecho para alquileres sin vueltas.</span>
    </div>
  </div>
</footer>
    </>
  )
}
