import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recherche de formations',
  description: 'Recherchez parmi nos formations professionnelles certifiantes disponibles sur IBIG E-LEARNING en Afrique francophone.',
  robots: { index: false, follow: true },
}

export default function RechercheLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
