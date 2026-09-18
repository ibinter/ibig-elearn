import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Video, Plus, ArrowLeft } from 'lucide-react'
import LiveSessionForm from './LiveSessionForm'
import LiveSessionList from './LiveSessionList'

export default async function LiveSessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['formateur', 'admin', 'coordinateur'].includes(profile?.role ?? '')) redirect('/tableau-de-bord')

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')
    .eq('instructor_id', user.id)
    .eq('is_published', true)
    .order('title')

  const { data: sessions } = await supabase
    .from('live_sessions')
    .select('*, course:courses(title)')
    .eq('instructor_id', user.id)
    .order('scheduled_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/formateur" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0B3D91]/10 flex items-center justify-center">
            <Video className="w-5 h-5 text-[#0B3D91]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sessions live</h1>
            <p className="text-gray-500 text-sm">Zoom, Google Meet — programmez vos sessions</p>
          </div>
        </div>
      </div>

      <LiveSessionForm courses={courses ?? []} instructorId={user.id} />
      <LiveSessionList sessions={(sessions ?? []) as any[]} />
    </div>
  )
}
