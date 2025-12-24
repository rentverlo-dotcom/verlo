import './globals.css'

export const metadata = {
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
      <body>{children}</body>
    </html>
  )
}
