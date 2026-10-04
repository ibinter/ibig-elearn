import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingWizard from './OnboardingWizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, country, job_title, goals, onboarding_completed')
    .eq('id', user.id)
    .single()

  // Déjà complété → tableau de bord
  if (profile?.onboarding_completed) redirect('/tableau-de-bord')

  // Top catégories pour les intérêts
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name')
    .limit(20)

  return (
    <OnboardingWizard
      userId={user.id}
      profile={profile as any}
      categories={categories ?? []}
    />
  )
}
