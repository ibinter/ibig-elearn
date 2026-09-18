import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Award, BookOpen, Flame, Star, MapPin, Calendar, ExternalLink } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('full_name, country').eq('id', id).single()
  if (!data) return { title: 'Profil introuvable' }
  return { title: `${data.full_name} — IBIG E-LEARN` }
}

export default async function ProfilPublicPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, bio, country, created_at, total_points, streak_days, level')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  const [{ data: certs }, { data: enrollments }] = await Promise.all([
    supabase
      .from('certificates')
      .select('id, issued_at, course:courses(title, slug)')
      .eq('user_id', id)
      .order('issued_at', { ascending: false }),
    supabase
      .from('enrollments')
      .select('progress_percent, course:courses(title, slug, thumbnail_url)')
      .eq('user_id', id)
      .eq('is_active', true)
      .order('enrolled_at', { ascending: false })
      .limit(6),
  ])

  const completedCount = enrollments?.filter(e => e.progress_percent >= 100).length ?? 0
  const initials = profile.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'

  const levelLabel = (level: string) => {
    const map: Record<string, string> = {
      debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé', expert: 'Expert'
    }
    return map[level] ?? 'Débutant'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-[#0B3D91] font-bold text-xl">IBIG E-LEARN</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Carte profil */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="h-24 ibig-gradient" />
          <div className="px-6 pb-6">
            <div className="-mt-12 mb-4 flex items-end justify-between">
              <div className="w-20 h-20 rounded-full border-4 border-white bg-[#0B3D91] flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : initials}
              </div>
              <span className="text-xs bg-[#FFA500]/10 text-[#FFA500] font-semibold px-3 py-1 rounded-full border border-[#FFA500]/20">
                {levelLabel(profile.level ?? 'debutant')}
              </span>
            </div>

            <h1 className="text-xl font-bold text-gray-900">{profile.full_name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
              {profile.country && (
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.country}</span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Membre depuis {new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            {profile.bio && <p className="mt-3 text-sm text-gray-600 leading-relaxed">{profile.bio}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: <BookOpen className="w-5 h-5 text-[#0B3D91]" />, value: completedCount, label: 'Formations\nterminées' },
            { icon: <Award className="w-5 h-5 text-[#FFA500]" />, value: certs?.length ?? 0, label: 'Certifi-\ncats' },
            { icon: <Flame className="w-5 h-5 text-orange-500" />, value: profile.streak_days ?? 0, label: 'Jours\nconsécutifs' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="flex justify-center mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Certifications */}
        {(certs?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-[#FFA500]" /> Certifications obtenues
            </h2>
            <div className="space-y-3">
              {certs!.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-3 bg-[#FFA500]/5 border border-[#FFA500]/20 rounded-xl">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{(cert.course as any)?.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Obtenu le {new Date(cert.issued_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <Link
                    href={`/mes-certificats/${cert.id}`}
                    className="flex items-center gap-1 text-xs text-[#0B3D91] font-medium hover:underline"
                  >
                    Voir <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formations en cours */}
        {(enrollments?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-[#0B3D91]" /> Parcours de formation
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {enrollments!.map((e, i) => {
                const course = e.course as any
                return (
                  <div key={i} className="border border-gray-200 rounded-xl p-4">
                    <p className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">{course?.title}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full ibig-gradient"
                          style={{ width: `${e.progress_percent}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 font-medium w-8 text-right">{e.progress_percent}%</span>
                    </div>
                    {e.progress_percent >= 100 && (
                      <span className="inline-block mt-1 text-xs text-green-600 font-semibold">✓ Terminée</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
