import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FormateurSidebar from '@/components/layout/FormateurSidebar'

// Espace privé : jamais indexé
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function FormateurLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('role, full_name, is_partner').eq('id', user.id).single()
  if (!profile || !['formateur', 'coordinateur', 'admin'].includes(profile.role)) {
    redirect('/tableau-de-bord')
  }
  // Formateur sans convention de partenariat signée : parcours partenaire d'abord
  if (profile.role === 'formateur' && !(profile as { is_partner?: boolean }).is_partner) {
    redirect('/devenir-partenaire')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <FormateurSidebar
        userName={profile.full_name ?? ''}
        userInitial={profile.full_name?.charAt(0) ?? 'F'}
      />
      <div className="lg:ml-64 flex-1 min-w-0 flex flex-col">
        <div className="h-[calc(3.5rem+env(safe-area-inset-top))] lg:hidden" />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-[calc(1.5rem+env(safe-area-inset-bottom))] animate-page-in">{children}</main>
      </div>
    </div>
  )
}
