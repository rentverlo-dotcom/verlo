// app/contacto/page.tsx
export const dynamic = "force-dynamic";

export default function ContactoPage() {
  return (
    <div style={container}>
      <h1 style={title}>Contacto</h1>

      <p style={p}>
        ¿Tenés dudas, consultas o necesitás ayuda con VERLO?
      </p>

      <p style={{ ...p, marginTop: "16px" }}>
        También podés escribirnos para ejercer tus derechos sobre datos
        personales (acceso, rectificación o eliminación).
      </p>

      <p style={{ ...p, marginTop: "16px" }}>
        Escribinos a:<br />
        <strong>hola@verlo.lat</strong>
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
  textAlign: "center",
};

const title: React.CSSProperties = {
  fontSize: "28px",
  marginBottom: "24px",
};

const p: React.CSSProperties = {
  opacity: 0.85,
  lineHeight: 1.6,
};
