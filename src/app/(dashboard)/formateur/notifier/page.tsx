import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotifyForm from './NotifyForm'

export default async function NotifierPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['formateur', 'admin', 'coordinateur'].includes(profile?.role ?? '')) redirect('/tableau-de-bord')

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, modules(id, title, lessons(id, title))')
    .eq('instructor_id', user.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Notifier mes apprenants</h1>
      <p className="text-gray-500 text-sm mb-8">Envoyez une alerte email à tous les apprenants inscrits lors d'une nouvelle leçon.</p>
      <NotifyForm courses={courses ?? []} />
    </div>
  )
}
