import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getManagedOrgs } from '@/lib/org'
import MobileNav from '@/components/layout/MobileNav'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import OfflineBanner from '@/components/pwa/OfflineBanner'

// Espace privé : jamais indexé
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()

  const managedOrgs = await getManagedOrgs(createAdminClient(), user.id)
  const orgHref = managedOrgs.length === 1 ? `/organisation/${managedOrgs[0].slug}` : managedOrgs.length ? '/organisation' : null

  const isFormateur = ['formateur', 'admin', 'coordinateur'].includes(profile?.role ?? '')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar
        userName={profile?.full_name ?? ''}
        userInitial={profile?.full_name?.charAt(0) ?? '?'}
        userRole={profile?.role ?? ''}
        userId={user.id}
        isFormateur={isFormateur}
        orgHref={orgHref}
      />

      <div className="lg:ml-64 print:!ml-0 flex-1 min-w-0 flex flex-col min-h-screen">
        <div className="h-[calc(3.5rem+env(safe-area-inset-top))] lg:hidden print:hidden" />
        <main id="contenu" tabIndex={-1} className="outline-none flex-1 min-w-0 p-4 sm:p-6 print:p-0 bottom-nav-offset lg:pb-6 animate-page-in">{children}</main>
      </div>
      <MobileNav />
      <OfflineBanner />
      <InstallPrompt />
    </div>
  )
}
