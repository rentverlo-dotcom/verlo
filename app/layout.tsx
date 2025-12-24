export const metadata = {
  title: 'VERLO',
  description: 'Alquiler directo, sin inmobiliaria',
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
