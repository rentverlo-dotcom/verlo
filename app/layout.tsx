import './globals.css'
import Script from 'next/script'

const ogImageUrl =
  'https://pub-804525ac911240ab845e611b752528e4.r2.dev/WhatsApp%20Image%202026-06-16%20at%2013.16.16.jpeg'

export const metadata = {
  title: 'VERLO',
  description: 'Alquiler directo, seguro y sin comisión.',
  icons: {
    icon: ogImageUrl,
    shortcut: ogImageUrl,
    apple: ogImageUrl,
  },
  openGraph: {
    title: 'VERLO',
    description: 'Alquiler directo, seguro y sin comisión.',
    url: 'https://verlo.lat',
    siteName: 'VERLO',
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'VERLO',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VERLO',
    description: 'Alquiler directo, seguro y sin comisión.',
    images: [ogImageUrl],
  },
}

const META_PIXEL_ID = '1467553351441050'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `,
          }}
        />

        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>

        {children}
      </body>
    </html>
  )
}
