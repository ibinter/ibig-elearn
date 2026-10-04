import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ — Questions fréquentes — IBIG E-LEARNING',
  description: 'Trouvez les réponses à toutes vos questions sur les formations, paiements, certifications, accès aux cours et support IBIG E-LEARNING.',
  keywords: ['FAQ IBIG', 'questions fréquentes formation en ligne', 'aide IBIG E-LEARNING'],
  alternates: { canonical: 'https://ibig-elearning.com/faq' },
  openGraph: {
    title: 'FAQ — Vos questions sur IBIG E-LEARNING',
    description: 'Toutes les réponses à vos questions sur la plateforme de formation en ligne IBIG.',
    url: 'https://ibig-elearning.com/faq',
  },
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
