import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FormateurSidebar from '@/components/layout/FormateurSidebar'

export default async function FormateurLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!profile || !['formateur', 'coordinateur', 'admin'].includes(profile.role)) {
    redirect('/tableau-de-bord')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <FormateurSidebar
        userName={profile.full_name ?? ''}
        userInitial={profile.full_name?.charAt(0) ?? 'F'}
      />
      <div className="lg:ml-64 flex-1 flex flex-col">
        <div className="h-14 lg:hidden" />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
