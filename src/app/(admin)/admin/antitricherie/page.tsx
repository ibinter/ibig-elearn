import { createClient } from '@/lib/supabase/server'
import { AlertTriangle, EyeOff, Clock, CheckCircle, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function AdminAntiTricheriePage() {
  const supabase = await createClient()

  const [
    { data: flaggedExams },
    { data: flaggedQuizzes },
    { count: totalFlaggedExams },
    { count: totalFlaggedQuizzes },
  ] = await Promise.all([
    supabase
      .from('final_exam_attempts')
      .select('id, score, passed, submitted_at, tab_switch_count, flag_reason, attempt_number, user_id, lesson:lessons(title)')
      .eq('is_flagged', true)
      .order('submitted_at', { ascending: false })
      .limit(50),
    supabase
      .from('quiz_attempts')
      .select('id, score, passed, tab_switch_count, flag_reason, user:profiles(full_name, email), lesson:lessons(title)')
      .eq('is_flagged', true)
      .order('attempted_at', { ascending: false })
      .limit(50),
    supabase.from('final_exam_attempts').select('*', { count: 'exact', head: true }).eq('is_flagged', true),
    supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }).eq('is_flagged', true),
  ])

  // Les tentatives d'examen référencent auth.users : noms récupérés à part
  const examUserIds = [...new Set((flaggedExams ?? []).map((a: { user_id: string }) => a.user_id))]
  const { data: examUsers } = examUserIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', examUserIds)
    : { data: [] }
  const examUserMap = new Map((examUsers ?? []).map(u => [u.id, u]))
  for (const a of (flaggedExams ?? []) as { user_id: string; user?: unknown }[]) a.user = examUserMap.get(a.user_id) ?? null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Surveillance anti-triche</h1>
        <p className="text-gray-500">Tentatives marquées comme suspectes par le système</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Examens signalés', value: totalFlaggedExams ?? 0, color: 'text-red-600 bg-red-50', icon: AlertTriangle },
          { label: 'Quiz signalés', value: totalFlaggedQuizzes ?? 0, color: 'text-orange-600 bg-orange-50', icon: AlertTriangle },
          { label: 'Tab switches > 3', value: (flaggedExams ?? []).filter((a: any) => (a.tab_switch_count ?? 0) >= 3).length, color: 'text-purple-600 bg-purple-50', icon: EyeOff },
          { label: 'Auto-soumissions', value: (flaggedExams ?? []).filter((a: any) => a.flag_reason?.includes('automatique')).length, color: 'text-blue-600 bg-blue-50', icon: Clock },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color} mb-3`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Examens finaux suspects */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="font-bold text-gray-900">Examens finaux suspects ({totalFlaggedExams ?? 0})</h2>
        </div>
        {(flaggedExams ?? []).length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Aucun examen suspect détecté</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Apprenant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Examen</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Onglets</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Raison</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(flaggedExams as any[]).map(a => (
                  <tr key={a.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-sm text-gray-900">{a.user?.full_name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{a.user?.email}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-sm text-gray-700 max-w-[200px] truncate">{a.lesson?.title ?? '—'}</p>
                      <p className="text-xs text-gray-400">Tentative #{a.attempt_number}</p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-sm font-bold ${a.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {a.passed ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {a.score}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-sm font-bold ${(a.tab_switch_count ?? 0) >= 3 ? 'text-red-600' : 'text-orange-600'}`}>
                        {a.tab_switch_count ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-red-600 max-w-[200px]">{a.flag_reason ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-400">
                      {a.submitted_at ? formatDate(a.submitted_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quiz suspects */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h2 className="font-bold text-gray-900">Quiz suspects ({totalFlaggedQuizzes ?? 0})</h2>
        </div>
        {(flaggedQuizzes ?? []).length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Aucun quiz suspect détecté</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Apprenant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Quiz</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Onglets</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Raison</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(flaggedQuizzes as any[]).map(a => (
                  <tr key={a.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-sm text-gray-900">{a.user?.full_name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{a.user?.email}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-sm text-gray-700 max-w-[200px] truncate">{a.lesson?.title ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-sm font-bold ${a.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {a.passed ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {a.score}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-sm font-bold ${(a.tab_switch_count ?? 0) >= 3 ? 'text-red-600' : 'text-orange-600'}`}>
                        {a.tab_switch_count ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-orange-600 max-w-[200px]">{a.flag_reason ?? '—'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
