import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vérifier un certificat — IBIG E-LEARNING',
  description: 'Vérifiez l\'authenticité d\'un certificat IBIG E-LEARNING en entrant le code ou l\'identifiant unique.',
  alternates: { canonical: 'https://ibig-elearning.com/verify' },
  keywords: ['vérifier certificat IBIG', 'authenticité diplôme', 'certificat formation en ligne'],
}

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
