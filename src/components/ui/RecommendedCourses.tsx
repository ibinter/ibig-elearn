'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, Users, ChevronRight, Sparkles } from 'lucide-react'

type Course = {
  id: string
  title: string
  slug: string
  thumbnail_url: string | null
  price_xof: number | null
  level: string | null
  rating_avg: number | null
  enrollment_count: number | null
  instructor: { full_name: string } | null
  category: { name: string } | null
}

const levelLabel: Record<string, string> = {
  debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé', tous_niveaux: 'Tous niveaux'
}

export default function RecommendedCourses({ title = 'Recommandés pour vous' }: { title?: string }) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/recommendations')
      .then(r => r.json())
      .then(data => { setCourses(data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#FFA500]" />
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-gray-100 rounded-2xl h-48 animate-pulse" />
        ))}
      </div>
    </div>
  )

  if (!courses.length) return null

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#FFA500]" />
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
        <Link href="/catalogue" className="text-sm text-[#0B3D91] font-semibold hover:underline flex items-center gap-1">
          Voir tout <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {courses.map(course => (
          <Link key={course.id} href={`/formation/${course.slug}`}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div className="aspect-video bg-gray-100 overflow-hidden">
              {course.thumbnail_url
                ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                : <div className="w-full h-full ibig-gradient flex items-center justify-center text-white/40 text-4xl">📚</div>
              }
            </div>
            <div className="p-3">
              <p className="text-xs text-gray-400 mb-1 truncate">{course.category?.name}</p>
              <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-[#0B3D91] transition-colors mb-2">
                {course.title}
              </h3>
              <p className="text-xs text-gray-500 truncate mb-2">{course.instructor?.full_name}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {(course.rating_avg ?? 0) > 0 && (
                    <>
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-semibold text-gray-700">{Number(course.rating_avg).toFixed(1)}</span>
                    </>
                  )}
                </div>
                <span className={`text-xs font-bold ${course.price_xof === 0 ? 'text-green-600' : 'text-[#0B3D91]'}`}>
                  {course.price_xof === 0 ? 'Gratuit' : `${(course.price_xof ?? 0).toLocaleString('fr')} XOF`}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
