import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
  description: 'Réinitialisez votre mot de passe IBIG E-LEARNING.',
  robots: { index: false, follow: false },
}

export default function MotDePasseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
