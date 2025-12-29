import './globals.css'
import Header from '@/components/Header'

export const metadata = {
  title: 'VERLO',
  description: 'Matching inmobiliario inteligente',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <Header />
        {children}
      </body>
    </html>
  )
}
