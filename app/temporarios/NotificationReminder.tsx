/** Mismo aviso para inquilinos y propietarios de VERLO Temporarios. */
export default function NotificationReminder() {
  return (
    <div
      role="note"
      style={{
        padding: "18px 20px",
        borderRadius: 18,
        background: "#fff4e8",
        border: "1px solid #e7c776",
        color: "#241b18",
        lineHeight: 1.5,
        display: "grid",
        gap: 8,
      }}
    >
      <strong style={{ fontSize: 16 }}>
        ¡IMPORTANTE! NO TE PIERDAS TUS COINCIDENCIAS
      </strong>
      <span>
        En VERLO pueden aparecer oportunidades en cualquier momento.
      </span>
      <span>
        <strong>📩 Revisá siempre tu email</strong>, incluida la carpeta Spam.
      </span>
      <span>
        <strong>🔔 Activá las notificaciones</strong> al terminar el formulario, si tu dispositivo lo permite.
      </span>
      <span>
        Si no ves nuestros avisos, podés perder muchas oportunidades de alquiler.
      </span>
    </div>
  )
}
