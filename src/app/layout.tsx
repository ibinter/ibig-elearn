import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CurrencyProvider } from '@/lib/currency-context'
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#0B3D91',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: 'IBIG E-LEARN — Formation professionnelle en ligne',
    template: '%s | IBIG E-LEARN',
  },
  description: 'La référence de la formation professionnelle en ligne en Afrique francophone. Formez-vous en ligne, certifiez-vous, progressez.',
  keywords: ['formation en ligne', 'e-learning', 'Afrique', 'certification', 'IBIG', 'cours en ligne'],
  authors: [{ name: 'IBIG EDUFORM' }],
  creator: 'IBIG SOFT',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://ibiglearn.com'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'IBIG E-LEARN',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192' }],
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'IBIG E-LEARN',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <CurrencyProvider>{children}</CurrencyProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
