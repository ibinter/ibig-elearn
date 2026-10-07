import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminShell from '@/components/layout/AdminShell'

// Espace privé : jamais indexé
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!profile || !['admin', 'coordinateur'].includes(profile.role)) redirect('/tableau-de-bord')

  return (
    <AdminShell
      userName={profile?.full_name ?? ''}
      userInitial={profile?.full_name?.charAt(0) ?? 'A'}
      userRole={profile?.role ?? ''}
    >
      {children}
    </AdminShell>
  )
}
