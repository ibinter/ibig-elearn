import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CourseEditor from '@/components/formateur/CourseEditor'

export default async function NouvelleFormationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['formateur', 'admin', 'coordinateur'].includes(profile?.role ?? '')) redirect('/tableau-de-bord')

  const { data: categories } = await supabase.from('categories').select('id, name').order('name')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nouvelle formation</h1>
      <CourseEditor categories={categories ?? []} />
    </div>
  )
}
