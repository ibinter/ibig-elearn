import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inscription gratuite',
  description: 'Créez votre compte gratuitement et accédez à des formations professionnelles certifiantes en Afrique francophone.',
  keywords: ['inscription formation en ligne', 'créer compte IBIG', 'formation gratuite Afrique'],
  openGraph: {
    title: 'Rejoignez IBIG E-LEARNING — Inscription gratuite',
    description: 'Créez votre compte et démarrez votre parcours de formation professionnelle en ligne.',
    images: [{ url: '/logo-full.webp', width: 1200, height: 630, alt: 'IBIG E-LEARNING' }],
  },
}

export default function InscriptionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
