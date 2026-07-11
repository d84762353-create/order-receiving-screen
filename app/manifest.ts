import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Grab Driver Simulator',
    short_name: 'Grab Driver',
    description: 'Aplikasi pengemudi untuk menerima order dan mengelola perjalanan.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#00b050',
    icons: [
      {
        src: '/images/grab-driver-logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/images/grab-driver-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
  }
}
