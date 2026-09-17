import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Eye, CheckCircle, XCircle, Users } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'

export default async function AdminFormationsPage() {
  const supabase = await createClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('*, instructor:profiles(full_name), category:categories(name), enrollments(count)')
    .order('created_at', { ascending: false })

  const levelLabel: Record<string, string> = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Formations</h1>
          <p className="text-gray-500">{courses?.length ?? 0} formation(s) au total</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Formation</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Formateur</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Niveau</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Prix (XOF)</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Inscrits</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(courses as any[])?.map(course => (
              <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-8 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full ibig-gradient flex items-center justify-center">
                          <BookOpen className="w-3.5 h-3.5 text-white/60" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate max-w-[200px]">{course.title}</p>
                      <p className="text-xs text-gray-400">{course.category?.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{course.instructor?.full_name}</td>
                <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{levelLabel[course.level] ?? course.level}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-[#0B3D91] hidden md:table-cell">{formatPrice(course.price_xof)}</td>
                <td className="px-4 py-3 text-right">
                  <span className="flex items-center justify-end gap-1 text-sm text-gray-600">
                    <Users className="w-3.5 h-3.5" /> {(course.enrollments as any)?.[0]?.count ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {course.is_published ? (
                    <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full w-fit">
                      <CheckCircle className="w-3.5 h-3.5" /> Publié
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full w-fit">
                      <XCircle className="w-3.5 h-3.5" /> Brouillon
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/formation/${course.slug}`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#0B3D91] transition-colors inline-block" title="Voir">
                    <Eye className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
            {(!courses || courses.length === 0) && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">Aucune formation pour l'instant</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
