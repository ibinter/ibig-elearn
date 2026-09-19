import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AnnouncementBar from '@/components/layout/AnnouncementBar'
import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import RefCapture from '@/components/referral/RefCapture'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Suspense><RefCapture /></Suspense>
      <AnnouncementBar />
      <Navbar user={profile} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
