export default function HomePage() {
  return (
    <>
      {/* HEADER */}
      <header>
        <div className="nav">
          <strong>VERLO</strong>
          <nav className="nav-links">
            <a href="#forms">Soy inquilino</a>
            <a href="#forms">Soy propietario</a>
          </nav>
        </div>
      </header>

  {/* HERO */}
<section
  style={{
    minHeight: "85vh",
    display: "flex",
    alignItems: "center",
    paddingTop: "120px",
    paddingBottom: "80px",
  }}
>
  <div className="container">
    <h1 className="hero-title">
      Alquilá sin inmobiliarias.
    </h1>

    <p
      style={{
        fontSize: "20px",
        maxWidth: "680px",
        marginTop: "16px",
      }}
    >
      Alquiler directo, sin inmobiliarias ni comisiones, con un proceso simple
      y transparente.
    </p>
    <button className="button">
  Empezar ahora
</button>


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
          Nada de llamadas eternas ni visitas que no encajan. El sistema busca
          compatibilidad real antes del contacto.
        </p>
      </div>

      <div className="card">
        <h3>Transparencia para ambos</h3>
        <p>
          Inquilinos y propietarios avanzan con la misma información desde el
          primer momento.
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
  </div>
  <button
  className="button"
  style={{
    marginTop: "40px",
    background: "transparent",
    color: "var(--accent)",
    border: "1px solid var(--accent)",
  }}
>
  Ver cómo empezar
</button>

</section>
    


      {/* TRANSPARENCIA */}
<section
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
        VERLO no promete resultados mágicos ni publica miles de avisos sin
        sentido.
      </p>

      <p
        style={{
          fontSize: "18px",
          lineHeight: 1.6,
          marginTop: "16px",
          opacity: 0.85,
        }}
      >
        Nuestro objetivo es simple: generar coincidencias reales entre
        inquilinos y propietarios que buscan lo mismo, reduciendo vueltas,
        conflictos y costos innecesarios.
      </p>

      <p
        style={{
          fontSize: "18px",
          lineHeight: 1.6,
          marginTop: "16px",
          opacity: 0.85,
        }}
      >
        Si no hay compatibilidad, no hay match. Así de claro.
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
              <form className="form">
                <input placeholder="Zona deseada" />
                <input placeholder="Presupuesto máximo" type="number" />
                <input placeholder="Tipo de garantía" />
                <textarea placeholder="Requisitos adicionales" />
                <button className="button" type="submit">
                  Buscar propiedades
                </button>
              </form>
            </div>

            {/* PROPIETARIO */}
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Soy propietario</h3>
              <form className="form">
                <input placeholder="Dirección de la propiedad" />
                <input placeholder="Zona" />
                <input placeholder="Precio mensual" type="number" />
                <textarea placeholder="Requisitos para inquilino" />
                <button className="button" type="submit">
                  Publicar propiedad
                </button>
              </form>
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
      <a href="#">Términos</a>
      <a href="#">Privacidad</a>
      <a href="mailto:hola@verlo.lat">Contacto</a>
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
