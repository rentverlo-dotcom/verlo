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
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div className="container">
          <h1>Encontrá tu match inmobiliario</h1>
          <p>
            VERLO te ahorra los gastos de inmobiliaria, ofreciéndote seguridad
            jurídica 100%.
          </p>
        </div>
      </section>

      {/* FORMS (SIN 100vh) */}
      <section
        id="forms"
        style={{
          paddingTop: "80px",
          paddingBottom: "120px",
        }}
      >
        <div className="container">
          <h2>Empezá ahora</h2>

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
    </>
  );
}
