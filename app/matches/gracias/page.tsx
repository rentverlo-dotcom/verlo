import VerloBrand from "@/components/VerloBrand"

export default function MatchGraciasPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F2EBEC",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#050002",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "620px",
          background: "#FFFFFF",
          borderRadius: "32px",
          padding: "48px 36px",
          textAlign: "center",
          boxShadow: "0 24px 70px rgba(5,0,2,0.10)",
        }}
      >
        <div style={{ marginBottom: "32px" }}>
          <VerloBrand width={64} showText={false} />
        </div>

        <div
          style={{
            display: "inline-block",
            background: "#F2A8A9",
            borderRadius: "999px",
            padding: "8px 14px",
            fontSize: "13px",
            fontWeight: 800,
            marginBottom: "22px",
          }}
        >
          Match confirmado
        </div>

        <h1
          style={{
            fontSize: "clamp(36px, 7vw, 56px)",
            lineHeight: 1,
            letterSpacing: "-0.05em",
            margin: "0 0 22px",
          }}
        >
          Perfecto. Querés avanzar.
        </h1>

        <p
          style={{
            fontSize: "18px",
            lineHeight: 1.55,
            margin: "0 auto",
            maxWidth: "480px",
            color: "rgba(5,0,2,0.68)",
          }}
        >
          Registramos tu interés. Vamos a revisar tus matches y avanzar con las
          conexiones compatibles.
        </p>

        <p
          style={{
            fontSize: "15px",
            lineHeight: 1.5,
            margin: "24px auto 0",
            maxWidth: "440px",
            color: "rgba(5,0,2,0.55)",
          }}
        >
          No tenés que hacer nada más por ahora. Te vamos a contactar cuando
          tengamos el próximo paso listo.
        </p>

        <a
          href="/"
          style={{
            display: "inline-flex",
            marginTop: "34px",
            background: "#050002",
            color: "#FFFFFF",
            textDecoration: "none",
            borderRadius: "999px",
            padding: "15px 26px",
            fontWeight: 900,
          }}
        >
          Volver a Verlo
        </a>
      </section>
    </main>
  )
}
