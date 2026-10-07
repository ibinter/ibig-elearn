import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connectez-vous à votre espace IBIG E-LEARNING pour accéder à vos formations, certificats et suivre votre progression.',
  robots: { index: false, follow: false },
}

export default function ConnexionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
