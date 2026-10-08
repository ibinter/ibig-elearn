import { redirect } from 'next/navigation'

// Ancienne adresse : la page des certificats est /mes-certificats
export default function CertificatsRedirect() {
  redirect('/mes-certificats')
}
