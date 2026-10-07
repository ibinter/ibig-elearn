import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CurrencyProvider } from '@/lib/currency-context'
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister'
import { getTenant } from '@/lib/tenant'
import TenantTheme from '@/components/tenant/TenantTheme'
import { SITE_URL } from '@/lib/site'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#0B3D91',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: {
    default: 'IBIG E-LEARNING — Formation professionnelle en ligne',
    template: '%s | IBIG E-LEARNING',
  },
  description: 'La référence de la formation professionnelle en ligne en Afrique francophone. Formez-vous en ligne, certifiez-vous, progressez.',
  keywords: ['formation en ligne', 'e-learning', 'Afrique', 'certification', 'IBIG', 'cours en ligne'],
  authors: [{ name: 'IBIG EDUFORM' }],
  creator: 'IBIG SOFT',
  metadataBase: new URL(SITE_URL),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'IBIG E-LEARNING',
  },
  icons: {
    icon: [
      { url: '/logo-icon.webp', type: 'image/webp' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/logo-icon.webp', type: 'image/webp' }],
    shortcut: '/logo-icon.webp',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'IBIG E-LEARNING',
    title: 'IBIG E-LEARNING — Formation professionnelle en ligne',
    description: 'La référence de la formation professionnelle en ligne en Afrique francophone. Formez-vous en ligne, certifiez-vous, progressez.',
    images: [{ url: '/logo-full.webp', width: 1200, height: 630, alt: 'IBIG E-LEARNING' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IBIG E-LEARNING — Formation professionnelle en ligne',
    description: 'La référence de la formation professionnelle en ligne en Afrique francophone.',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenant()
  return (
    <html lang="fr">
      <body className={`${inter.className} overflow-x-clip w-full`}>
        {tenant && <TenantTheme tenant={tenant} />}
        <CurrencyProvider>{children}</CurrencyProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
