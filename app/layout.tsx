import './globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Verlo | El Futuro del Alquiler',
  description: 'Alquila con libertad total',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          rel="stylesheet"
        />
        <link
          href="https://unpkg.com/aos@2.3.1/dist/aos.css"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}

        <Script
          src="https://unpkg.com/aos@2.3.1/dist/aos.js"
          strategy="afterInteractive"
        />

        <Script id="aos-init" strategy="afterInteractive">
          {`
            AOS.init({
              duration: 1000,
              once: true,
              offset: 100
            });

            document.addEventListener('mousemove', (e) => {
              const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
              const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
              const bg = document.querySelector('.glow-bg');
              if (bg) bg.style.transform = \`translate(\${moveX}px, \${moveY}px)\`;
            });
          `}
        </Script>
      </body>
    </html>
  )
}
