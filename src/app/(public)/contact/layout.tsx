import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez l\'équipe IBIG E-LEARNING. Nous sommes disponibles pour répondre à toutes vos questions sur nos formations, certifications et partenariats.',
  keywords: ['contact IBIG', 'support formation en ligne', 'assistance IBIG E-LEARNING'],
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contactez IBIG E-LEARNING',
    description: 'Notre équipe est à votre disposition pour vous accompagner dans votre parcours de formation.',
    url: '/contact',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
