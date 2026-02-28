// app/privacidad/page.tsx
export const dynamic = "force-dynamic";

export default function PrivacidadPage() {
  return (
    <div style={container}>
      <h1 style={title}>Política de Privacidad</h1>

      <p style={p}>
        En VERLO nos tomamos en serio la privacidad y protección de los datos
        personales de nuestros usuarios, de conformidad con la Ley N° 25.326 de
        Protección de Datos Personales y normativa aplicable en la República
        Argentina.
      </p>

      <h2 style={h2}>1. Datos que recolectamos</h2>
      <p style={p}>
        Para habilitar funciones que implican contacto entre personas,
        verificación de identidad y celebración de contratos, podemos
        recolectar datos personales tales como nombre, DNI, imagen del
        documento, selfie, prueba de vida (liveness) y datos de contacto.
      </p>

      <h2 style={h2}>2. Finalidad del tratamiento</h2>
      <p style={p}>
        Los datos se utilizan exclusivamente para:
        <br />– Verificación de identidad
        <br />– Prevención de fraude
        <br />– Seguridad entre las partes
        <br />– Habilitación de visitas, contacto y contratos
      </p>

      <h2 style={h2}>3. Proveedor de verificación</h2>
      <p style={p}>
        La verificación de identidad es realizada por un proveedor externo
        especializado, actualmente <strong>Truora</strong>, quien actúa como
        encargado del tratamiento de los datos.
      </p>
      <p style={p}>
        VERLO no almacena copias de documentos ni datos biométricos. Únicamente
        conserva el resultado del proceso de verificación (aprobado, rechazado
        o pendiente) y metadatos asociados.
      </p>

      <h2 style={h2}>4. Consentimiento</h2>
      <p style={p}>
        Al utilizar las funciones de verificación de identidad, el usuario
        presta su consentimiento libre, expreso e informado para el tratamiento
        de sus datos personales conforme a esta Política de Privacidad.
      </p>

      <h2 style={h2}>5. Conservación de los datos</h2>
      <p style={p}>
        Los datos personales se conservan únicamente durante el tiempo
        necesario para cumplir con las finalidades descriptas o mientras exista
        una relación activa con el usuario, salvo obligación legal en contrario.
      </p>

      <h2 style={h2}>6. Derechos del titular</h2>
      <p style={p}>
        El titular de los datos puede ejercer sus derechos de acceso,
        rectificación, actualización o supresión conforme al artículo 14 de la
        Ley 25.326, escribiendo a <strong>hola@verlo.lat</strong>.
      </p>

      <h2 style={h2}>7. Responsable del tratamiento</h2>
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
