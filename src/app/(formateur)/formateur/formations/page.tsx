import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { PlusCircle, Pencil, Eye, Users, BookOpen, ListOrdered } from 'lucide-react'

export default async function FormateurFormationsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: courses } = await supabase
    .from('courses')
    .select(`id, title, slug, thumbnail_url, is_published, price, currency, level, created_at, enrollments(count)`)
    .eq('instructor_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mes formations</h1>
        <Link
          href="/formateur/formations/nouvelle"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Nouvelle formation
        </Link>
      </div>

      {!courses?.length ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <BookOpen className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-lg">Aucune formation</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">Créez votre première formation pour commencer à enseigner</p>
          <Link
            href="/formateur/formations/nouvelle"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Créer une formation
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Formation</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Niveau</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Apprenants</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map(course => {
                const enrollCount = (course.enrollments as any)?.[0]?.count ?? 0
                return (
                  <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-9 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          {course.thumbnail_url ? (
                            <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-base">📚</div>
                          )}
                        </div>
                        <span className="font-medium text-gray-900 text-sm line-clamp-1">{course.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 capitalize">{course.level}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="flex items-center justify-end gap-1 text-sm text-gray-600">
                        <Users className="w-3.5 h-3.5" />
                        {enrollCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        course.is_published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {course.is_published ? 'Publié' : 'Brouillon'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/formation/${course.slug}`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/formateur/formations/${course.id}/lecons`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-purple-600 transition-colors"
                          title="Gérer les leçons"
                        >
                          <ListOrdered className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/formateur/formations/${course.id}/modifier`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
