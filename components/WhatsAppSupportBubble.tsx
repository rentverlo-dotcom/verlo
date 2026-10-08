"use client"

export default function WhatsAppSupportBubble() {
  const whatsappBase =
    "https://wa.me/5491176518603"

  const message =
    "Hola Verlo 👋 Necesito ayuda con la plataforma."

  const href =
    `${whatsappBase}?text=${encodeURIComponent(
      message
    )}`

  return (
    <>
      <a
        className="verlo-whatsapp-support"
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label="Soporte por WhatsApp"
        title="Soporte por WhatsApp"
      >
        <svg
          viewBox="0 0 32 32"
          aria-hidden="true"
        >
          <path
            d="M16 3.2c-7.1 0-12.8 5.6-12.8 12.6 0 2.4.7 4.7 1.9 6.7L3 29l6.8-2.1c1.9 1 4 1.6 6.2 1.6 7.1 0 12.8-5.6 12.8-12.6S23.1 3.2 16 3.2Zm0 22.9c-2 0-3.9-.5-5.5-1.5l-.4-.2-4 1.2 1.2-3.9-.3-.4c-1.1-1.7-1.6-3.6-1.6-5.5C5.4 10.1 10.1 5.5 16 5.5s10.6 4.6 10.6 10.3S21.9 26.1 16 26.1Zm5.8-7.7c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2.1-.4 0-.6-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.3 3.4 1.5 3.6c.2.2 2.5 3.8 6.1 5.3.9.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5-.1-.2-.4-.3-.7-.5Z"
            fill="currentColor"
          />
        </svg>

        <span>
          ¿Necesitás ayuda?
        </span>
      </a>

      <style jsx global>{`
        .verlo-whatsapp-support {
          position: fixed;
          right: 20px;
          bottom: 20px;
          z-index: 9999;

          display: inline-flex;
          align-items: center;
          gap: 10px;

          min-height: 54px;
          padding: 0 18px;

          border-radius: 999px;

          background: #050002;
          color: #fff;

          text-decoration: none;

          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          font-size: 13px;
          font-weight: 900;

          box-shadow:
            0 14px 36px
            rgba(5, 0, 2, 0.22);

          transition:
            transform 160ms ease,
            box-shadow 160ms ease;
        }

        .verlo-whatsapp-support:hover {
          transform:
            translateY(-2px);

          box-shadow:
            0 18px 42px
            rgba(5, 0, 2, 0.28);
        }

        .verlo-whatsapp-support svg {
          width: 24px;
          height: 24px;
          flex: 0 0 auto;
        }

        @media (max-width: 640px) {
          .verlo-whatsapp-support {
            right: 12px;
            bottom: 12px;

            min-height: 52px;
            max-width: calc(100vw - 24px);
            padding: 0 14px;

            gap: 8px;
            justify-content: center;
          }

          .verlo-whatsapp-support span {
            display: inline;
            white-space: nowrap;
          }
        }
      `}</style>
    </>
  )
}
