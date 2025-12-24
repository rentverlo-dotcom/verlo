import "./globals.css";

export const metadata = {
  title: "Verlo | El Futuro del Alquiler",
  description: "Alquila con libertad total",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
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
        <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              AOS.init({ duration: 1000, once: true, offset: 100 });
            `,
          }}
        />
      </body>
    </html>
  );
}
