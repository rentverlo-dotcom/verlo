'use client'
import HeroCarousel from '@/components/HeroCarousel'
import LiveCounter from '@/components/LiveCounter'

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
            Pero con seguridad jurídica, personal, y mucho más ágil y eficiente.
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
            Empezar gratis
          </button>
          <LiveCounter />
        </div>
      </section>

      <HeroCarousel />
      
      {/* HERO BRIDGE */}
     
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
              Empezar gratis
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
              Empezar gratis
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
        marginTop: "40px",
      }}
    >
      {/*
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Soy inquilino</h3>
        <p>Encontrá propiedades compatibles con tu perfil.</p>
        <a href="/inquilino/registro">
          <button className="button">Buscar propiedades</button>
        </a>
      </div>
      */}

      <div
        className="card"
        style={{
          width: "100%",
          padding: "48px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Soy propietario</h3>
        <p style={{ fontSize: "16px", marginTop: "12px" }}>
          Publicá tu propiedad y recibí inquilinos compatibles.
        </p>

        <div style={{ marginTop: "24px" }}>
          <a href="/propietario/publicar">
            <button className="button">Publicar propiedad</button>
          </a>
        </div>
      </div>
    </div>
  </div>
</section>
      
  {/* FOOTER */}
<footer
  style={{
    padding: "60px 24px 40px",
    borderTop: "1px solid #e2e8f0",
    background: "#f8fafc",
  }}
>
  <div
    className="container"
    style={{
      maxWidth: 1100,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "1fr auto",
      gap: "40px",
    }}
  >
    {/* LEFT */}
    <div>
      <strong
        style={{
          fontSize: "16px",
          letterSpacing: "0.5px",
          color: "#0f172a",
        }}
      >
        VERLO
      </strong>

      <p
        style={{
          marginTop: "10px",
          maxWidth: "480px",
          color: "#475569",
          fontSize: "14px",
          lineHeight: 1.6,
        }}
      >
        Alquiler directo entre inquilinos y propietarios, sin intermediarios
        ni comisiones innecesarias.
      </p>
    </div>

    {/* RIGHT */}
    <div
      style={{
        display: "grid",
        gap: "12px",
        fontSize: "14px",
        textAlign: "right",
      }}
    >
      <a href="/terminos" style={{ color: "#0f172a", opacity: 0.8 }}>
        Términos
      </a>
      <a href="/privacidad" style={{ color: "#0f172a", opacity: 0.8 }}>
        Privacidad
      </a>
      <a href="/contacto" style={{ color: "#0f172a", opacity: 0.8 }}>
        Contacto
      </a>
      <a href="/#transparencia" style={{ color: "#0f172a", opacity: 0.8 }}>
        Transparencia
      </a>
    </div>
  </div>

  {/* BOTTOM */}
  <div
    style={{
      marginTop: "40px",
      borderTop: "1px solid #e2e8f0",
      paddingTop: "20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "13px",
      color: "#64748b",
      maxWidth: 1100,
      marginInline: "auto",
    }}
  >
    <span>
      © {new Date().getFullYear()} VERLO. Todos los derechos reservados.
    </span>

    <span>Hecho para alquileres sin vueltas.</span>
  </div>
</footer>
    </>
  )
}
