import { createAdminClient } from '@/lib/supabase/admin'
import { Target } from 'lucide-react'
import SkillsManager from './SkillsManager'

export const metadata = { title: 'Référentiel de compétences' }

export default async function AdminCompetencesPage() {
  const admin = createAdminClient()
  const [{ data: skills }, { data: links }, { data: acquired }] = await Promise.all([
    admin.from('skills').select('id, name, category').order('category').order('name'),
    admin.from('course_skills').select('skill_id'),
    admin.from('user_skills').select('skill_id'),
  ])
  const count = (rows: { skill_id: string }[] | null, id: string) => (rows ?? []).filter(r => r.skill_id === id).length

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Target className="w-6 h-6 text-[#0B3D91]" /> Référentiel de compétences</h1>
        <p className="text-gray-500 text-sm mt-1">Les formateurs associent ces compétences à leurs formations ; elles s&apos;affichent sur les profils des apprenants et dans la matrice de compétences des entreprises.</p>
      </div>
      <SkillsManager skills={(skills ?? []).map(s => ({ ...s, courses: count(links, s.id), learners: count(acquired, s.id) }))} />
    </div>
  )
}
