import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact — IBIG E-LEARNING',
  description: 'Contactez l\'équipe IBIG E-LEARNING. Nous sommes disponibles pour répondre à toutes vos questions sur nos formations, certifications et partenariats.',
  keywords: ['contact IBIG', 'support formation en ligne', 'assistance IBIG E-LEARNING'],
  alternates: { canonical: 'https://ibig-elearning.com/contact' },
  openGraph: {
    title: 'Contactez IBIG E-LEARNING',
    description: 'Notre équipe est à votre disposition pour vous accompagner dans votre parcours de formation.',
    url: 'https://ibig-elearning.com/contact',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
