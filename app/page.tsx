export default function HomePage() {
  return (
    <>
  
  {/* HERO */}
<section
  style={{
    minHeight: "85vh",
    display: "flex",
    alignItems: "center",
    paddingTop: "140px",
    paddingBottom: "100px",
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
        color: "#0f172a",
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
</>
  )
}

    {/* HERO BRIDGE */}
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
  </div>
</section>


      {/* QUE ES VERLO */}
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
        marginTop: "16px",
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

    {/* CTA 2 — CIERRE DE SECCIÓN */}
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
  </div>
 {/* CTA 3 */}
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
      {/* INQUILINO */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Soy inquilino</h3>
        <p>Encontrá propiedades compatibles con tu perfil.</p>
        <a href="/inquilino/registro">
          <button className="button">Buscar propiedades</button>
        </a>
      </div>

      {/* PROPIETARIO */}
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
    padding: "60px 24px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    background: "#0b0b0e",
  }}
>
  <div
    className="container"
    style={{
      display: "grid",
      gridTemplateColumns: "1fr auto",
      gap: "24px",
      alignItems: "center",
    }}
  >
    {/* LEFT */}
    <div>
      <strong style={{ fontSize: "18px" }}>VERLO</strong>
      <p
        style={{
          marginTop: "8px",
          opacity: 0.7,
          maxWidth: "420px",
        }}
      >
        Alquiler directo entre inquilinos y propietarios, sin intermediarios
        ni comisiones innecesarias.
      </p>
    </div>

    {/* RIGHT */}
    <div
      style={{
        display: "flex",
        gap: "24px",
        fontSize: "14px",
        opacity: 0.8,
      }}
    >
      <a href="/terminos">Términos</a>
      <a href="/privacidad">Privacidad</a>
      <a href="/contacto">Contacto</a>
    </div>
  </div>

  {/* BOTTOM */}
  <div
    style={{
      marginTop: "32px",
      textAlign: "center",
      fontSize: "13px",
      opacity: 0.5,
    }}
  >
    © {new Date().getFullYear()} VERLO. Todos los derechos reservados.
  </div>
</footer>
</> 
  ); 
}
