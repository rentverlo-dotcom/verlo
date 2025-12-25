import "./globals.css";

export const metadata = {
  title: "VERLO",
  description: "Matching inmobiliario inteligente",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
