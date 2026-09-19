import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/layout/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!profile || !['admin', 'coordinateur'].includes(profile.role)) redirect('/tableau-de-bord')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar
        userName={profile?.full_name ?? ''}
        userInitial={profile?.full_name?.charAt(0) ?? 'A'}
        userRole={profile?.role ?? ''}
      />
      <div className="lg:ml-60 flex-1 flex flex-col">
        <div className="h-14 lg:hidden" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
