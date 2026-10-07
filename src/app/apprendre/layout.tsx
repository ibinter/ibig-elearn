import type { Metadata } from 'next'

// Espace privé : jamais indexé
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function ApprendreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
