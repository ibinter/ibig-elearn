import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MobileNav from '@/components/layout/MobileNav'
import DashboardSidebar from '@/components/layout/DashboardSidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()

  const isFormateur = ['formateur', 'admin', 'coordinateur'].includes(profile?.role ?? '')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar
        userName={profile?.full_name ?? ''}
        userInitial={profile?.full_name?.charAt(0) ?? '?'}
        userRole={profile?.role ?? ''}
        userId={user.id}
        isFormateur={isFormateur}
      />

      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen">
        <div className="h-14 lg:hidden" />
        <main className="flex-1 p-6 pb-20 lg:pb-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  )
}
