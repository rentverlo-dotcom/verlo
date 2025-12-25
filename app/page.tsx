export default function HomePage() {
  return (
    <>
      {/* HEADER */}
      <header>
        <div className="nav">
          <strong>VERLO</strong>
          <nav className="nav-links">
            <a href="#inquilino">Soy inquilino</a>
            <a href="#propietario">Soy propietario</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section>
        <div className="container">
          <h1>Encontrá tu match inmobiliario</h1>
          <p>
            VERLO conecta inquilinos y propietarios de forma inteligente,
            rápida y transparente.
          </p>
        </div>
      </section>

      {/* INQUILINO */}
      <section id="inquilino">
        <div className="container">
          <h2>Soy inquilino</h2>
          <div className="card">
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
        </div>
      </section>

      {/* PROPIETARIO */}
      <section id="propietario">
        <div className="container">
          <h2>Soy propietario</h2>
          <div className="card">
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
      </section>
    </>
  );
}
