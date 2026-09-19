import { createClient } from '@/lib/supabase/server'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import ApprovalActions from './ApprovalActions'

export default async function ApprobationsPage() {
  const supabase = await createClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('*, instructor:profiles(full_name, email), category:categories(name)')
    .eq('approval_status', 'pending')
    .order('submitted_at', { ascending: true })

  const { data: history } = await supabase
    .from('courses')
    .select('id, title, approval_status, approval_note, approved_at, instructor:profiles(full_name)')
    .in('approval_status', ['approved', 'rejected'])
    .order('approved_at', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approbation des formations</h1>
        <p className="text-gray-500 mt-1">{courses?.length ?? 0} formation(s) en attente de validation</p>
      </div>

      {/* File d'attente */}
      {!courses?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune formation en attente d&apos;approbation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(courses as any[]).map(course => (
            <div key={course.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start gap-4">
                {course.thumbnail_url && (
                  <img src={course.thumbnail_url} alt="" className="w-20 h-14 object-cover rounded-xl flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{course.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {course.instructor?.full_name} · {(course.category as any)?.name}
                        {course.submitted_at && ` · Soumis le ${new Date(course.submitted_at).toLocaleDateString('fr-FR')}`}
                      </p>
                      {course.short_description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{course.short_description}</p>
                      )}
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-full flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" /> En attente
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <a href={`/formation/${course.slug}`} target="_blank"
                      className="text-sm text-[#0B3D91] hover:underline">Voir la formation →</a>
                    <ApprovalActions courseId={course.id} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Historique */}
      {history && history.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Historique récent</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Formation</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Formateur</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(history as any[]).map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{c.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{c.instructor?.full_name}</td>
                  <td className="px-4 py-3 text-center">
                    {c.approval_status === 'approved'
                      ? <span className="flex items-center justify-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Approuvé</span>
                      : <span className="flex items-center justify-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full"><XCircle className="w-3 h-3" /> Refusé</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 hidden lg:table-cell">{c.approval_note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
