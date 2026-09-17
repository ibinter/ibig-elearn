import { redirect } from 'next/navigation'

// La page racine redirige vers la page d'accueil publique
export default function RootPage() {
  redirect('/')
}
