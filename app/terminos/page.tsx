// app/terminos/page.tsx
export const dynamic = "force-dynamic";

export default function TerminosPage() {
  return (
    <div style={container}>
      <h1 style={title}>Términos y Condiciones</h1>

      <p style={p}>
        Al utilizar VERLO aceptás los presentes Términos y Condiciones.
      </p>

      <h2 style={h2}>1. Objeto</h2>
      <p style={p}>
        VERLO es una plataforma digital que facilita el contacto entre
        inquilinos y propietarios, así como la coordinación de visitas y la
        generación de contratos, sin actuar como intermediario inmobiliario ni
        como parte de la relación contractual entre las partes.
      </p>

      <h2 style={h2}>2. Responsabilidad</h2>
      <p style={p}>
        VERLO no garantiza operaciones, pagos ni resultados, ni reemplaza
        asesoramiento legal, inmobiliario o profesional.
      </p>

      <h2 style={h2}>3. Verificación de identidad</h2>
      <p style={p}>
        Para habilitar determinadas funcionalidades como el contacto, las
        visitas o la firma de contratos, puede ser obligatorio validar la
        identidad del usuario mediante proveedores externos especializados.
      </p>
      <p style={p}>
        El usuario acepta que dicha verificación es una condición necesaria
        para el uso de estas funciones.
      </p>

      <h2 style={h2}>4. Uso indebido</h2>
      <p style={p}>
        El uso fraudulento, engañoso o contrario a la ley podrá derivar en la
        suspensión o cancelación del acceso a la plataforma.
      </p>

      <h2 style={h2}>5. Jurisdicción</h2>
      <p style={p}>
        Estos Términos y Condiciones se rigen por las leyes de la República
        Argentina.
      </p>
    </div>
  );
}

const container: React.CSSProperties = {
  minHeight: "100vh",
  background: "#000",
  color: "#fff",
  padding: "32px",
  maxWidth: "720px",
  margin: "0 auto",
};

const title: React.CSSProperties = {
  fontSize: "28px",
  marginBottom: "24px",
};

const h2: React.CSSProperties = {
  fontSize: "18px",
  marginTop: "24px",
  marginBottom: "8px",
};

const p: React.CSSProperties = {
  opacity: 0.85,
  lineHeight: 1.6,
};
