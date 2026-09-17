import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

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
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'IBIG E-LEARN',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
