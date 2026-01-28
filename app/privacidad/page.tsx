// app/privacidad/page.tsx
export const dynamic = "force-dynamic";

export default function PrivacidadPage() {
  return (
    <div style={container}>
      <h1 style={title}>Política de Privacidad</h1>

      <p style={p}>
        En VERLO nos tomamos en serio la privacidad y protección de los datos
        personales de nuestros usuarios.
      </p>

      <h2 style={h2}>1. Datos que recolectamos</h2>
      <p style={p}>
        Para habilitar funciones que implican contacto entre personas,
        recolectamos datos identificatorios como DNI, imagen del documento,
        selfie y datos de contacto.
      </p>

      <h2 style={h2}>2. Finalidad</h2>
      <p style={p}>
        Los datos se utilizan exclusivamente para verificación de identidad,
        prevención de fraude y habilitación de visitas, contacto y contratos.
      </p>

      <h2 style={h2}>3. Proveedor</h2>
      <p style={p}>
        La verificación es realizada por <strong>Truora</strong>. VERLO no almacena
        documentos ni datos biométricos, solo el resultado del proceso.
      </p>

      <h2 style={h2}>4. Derechos</h2>
      <p style={p}>
        Podés ejercer tus derechos de acceso, rectificación o eliminación
        escribiendo a <strong>hola@verlo.lat</strong>.
      </p>

      <h2 style={h2}>5. Responsable</h2>
      <p style={p}>
        VERLO – Servicios digitales<br />
        Titular: Juan Manuel Oddone<br />
        Contacto: hola@verlo.lat
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
