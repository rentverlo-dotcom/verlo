// app/layout.tsx
export const metadata = {
  title: 'VERLO',
  description: 'Plataforma de matching inmobiliario',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
