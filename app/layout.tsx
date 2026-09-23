import './globals.css'
import Script from 'next/script'
import PwaRegister from './pwa-register'

const ogImageUrl = 'https://verlo.lat/logo-verlo.png'

export const metadata = {
  title: 'VERLO',
  description: 'Alquiler directo, seguro y sin comisión.',
  icons: {
    icon: ogImageUrl,
    shortcut: ogImageUrl,
    apple: ogImageUrl,
  },
  appleWebApp: {
    capable: true,
    title: 'Verlo',
    statusBarStyle: 'default',
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

const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || ''

const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || ''

const POSTHOG_ENABLED =
  Boolean(
    POSTHOG_KEY &&
    POSTHOG_HOST
  )

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <PwaRegister />

        {POSTHOG_ENABLED ? (
          <>
            <Script
              id="posthog-library"
              src={`${POSTHOG_HOST.replace(
                '.i.posthog.com',
                '-assets.i.posthog.com'
              )}/static/array.js`}
              strategy="afterInteractive"
            />

            <Script
              id="posthog-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  (function initPostHog(attempt) {
                    if (
                      window.posthog &&
                      typeof window.posthog.init === 'function'
                    ) {
                      window.posthog.init(
                        ${JSON.stringify(POSTHOG_KEY)},
                        {
                          api_host: ${JSON.stringify(POSTHOG_HOST)},
                          autocapture: true,
                          capture_pageview: true,
                          capture_pageleave: true,
                          session_recording: {
                            maskAllInputs: true
                          }
                        }
                      );
                      return;
                    }

                    if (attempt < 50) {
                      window.setTimeout(function () {
                        initPostHog(attempt + 1);
                      }, 100);
                    }
                  })(0);
                `,
              }}
            />
          </>
        ) : null}

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
