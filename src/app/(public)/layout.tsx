import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AnnouncementBar from '@/components/layout/AnnouncementBar'
import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import RefCapture from '@/components/referral/RefCapture'
import PublicTabBar from '@/components/layout/PublicTabBar'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const role = profile?.role
  const dashboardHref = role === 'admin' || role === 'coordinateur' ? '/admin' : role === 'formateur' ? '/formateur' : '/tableau-de-bord'

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <Suspense><RefCapture /></Suspense>
      <AnnouncementBar />
      <Navbar user={profile} />
      <main id="contenu" tabIndex={-1} className="flex-1 overflow-x-clip animate-page-in outline-none">{children}</main>
      <Footer />
      <PublicTabBar isLoggedIn={!!user} dashboardHref={dashboardHref} />
    </div>
  )
}
