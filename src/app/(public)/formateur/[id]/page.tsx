import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Users, Star, Award, MapPin, Globe } from 'lucide-react'
import PriceDisplay from '@/components/ui/PriceDisplay'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('full_name, bio, country').eq('id', id).single()
  if (!data) return { title: 'Formateur introuvable' }
  return {
    title: `${data.full_name} — Formateur IBIG E-LEARN`,
    description: data.bio ?? `Découvrez les formations de ${data.full_name} sur IBIG E-LEARN.`,
  }
}

export default async function FormateurPublicPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: formateur } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, bio, country, created_at')
    .eq('id', id)
    .eq('role', 'formateur')
    .single()

  if (!formateur) notFound()

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, slug, thumbnail_url, price_xof, price_eur, price_usd, level, enrollment_count, rating_average, duration_hours, category:categories(name)')
    .eq('instructor_id', id)
    .eq('is_published', true)
    .order('enrollment_count', { ascending: false })

  const totalStudents = courses?.reduce((sum, c) => sum + (c.enrollment_count ?? 0), 0) ?? 0
  const avgRating = courses?.length
    ? (courses.reduce((sum, c) => sum + (c.rating_average ?? 0), 0) / courses.length).toFixed(1)
    : '0.0'
  const initials = formateur.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'

  const levelLabel: Record<string, string> = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' }
  const levelColor: Record<string, string> = { debutant: 'bg-green-100 text-green-700', intermediaire: 'bg-yellow-100 text-yellow-700', avance: 'bg-red-100 text-red-700' }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header formateur */}
      <div className="ibig-gradient text-white py-12 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-24 h-24 rounded-full border-4 border-white/30 bg-white/20 flex items-center justify-center text-3xl font-bold overflow-hidden flex-shrink-0">
            {formateur.avatar_url
              ? <img src={formateur.avatar_url} alt={formateur.full_name} className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold">{formateur.full_name}</h1>
            <p className="text-blue-200 text-sm mt-1">Formateur certifié IBIG E-LEARN</p>
            {formateur.country && (
              <p className="flex items-center gap-1.5 text-blue-200 text-sm mt-1">
                <MapPin className="w-3.5 h-3.5" />{formateur.country}
              </p>
            )}
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                <BookOpen className="w-4 h-4" /> {courses?.length ?? 0} formation{(courses?.length ?? 0) > 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                <Users className="w-4 h-4" /> {totalStudents.toLocaleString()} apprenants
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                <Star className="w-4 h-4 fill-[#FFA500] text-[#FFA500]" /> {avgRating} / 5
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Bio */}
        {formateur.bio && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#0B3D91]" /> À propos
            </h2>
            <p className="text-gray-600 leading-relaxed">{formateur.bio}</p>
          </div>
        )}

        {/* Formations */}
        <div>
          <h2 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#0B3D91]" /> Formations ({courses?.length ?? 0})
          </h2>
          {(courses?.length ?? 0) === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
              Aucune formation publiée pour l'instant.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {courses!.map(course => (
                <Link key={course.id} href={`/formation/${course.slug}`}
                  className="bg-white rounded-2xl border border-gray-200 hover:shadow-md hover:border-[#0B3D91]/20 transition-all overflow-hidden flex flex-col group">
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    {course.thumbnail_url
                      ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full ibig-gradient flex items-center justify-center"><BookOpen className="w-8 h-8 text-white/50" /></div>}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-[#0B3D91] font-medium">{(course.category as any)?.name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${levelColor[course.level]}`}>{levelLabel[course.level]}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug mb-3 flex-1 group-hover:text-[#0B3D91] transition-colors">{course.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-[#FFA500] fill-[#FFA500]" />{course.rating_average?.toFixed(1)}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.enrollment_count}</span>
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                      <PriceDisplay price_xof={course.price_xof} price_eur={course.price_eur} price_usd={course.price_usd} className="text-base font-bold text-[#0B3D91]" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
