import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Verlo',
    short_name: 'Verlo',
    description: 'Alquiler directo, seguro y sin comisión.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8f6f2',
    theme_color: '#f8f6f2',
    orientation: 'portrait',
    icons: [
      {
        src: '/logo-verlo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo-verlo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
