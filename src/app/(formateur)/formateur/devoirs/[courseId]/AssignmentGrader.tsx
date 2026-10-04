'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, ExternalLink, FileText, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  submission: any
  courseId: string
  graderId: string
}

export default function AssignmentGrader({ submission: initialSub, courseId, graderId }: Props) {
  const [sub, setSub] = useState(initialSub)
  const [expanded, setExpanded] = useState(sub.status === 'submitted')
  const [score, setScore] = useState<string>(sub.score?.toString() ?? '')
  const [feedback, setFeedback] = useState(sub.feedback ?? '')
  const [action, setAction] = useState<'grade' | 'reject'>('grade')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const maxScore = sub.assignments?.max_score ?? 100
  const passingScore = sub.assignments?.passing_score ?? 60

  const handleGrade = async () => {
    const scoreNum = parseInt(score)
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > maxScore) return

    setLoading(true)
    const newStatus = action === 'reject' ? 'rejected' : 'graded'
    const passed = action === 'grade' && scoreNum >= passingScore

    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({
        status: newStatus,
        score: action === 'grade' ? scoreNum : null,
        feedback,
        graded_by: graderId,
        graded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sub.id)
      .select()
      .single()

    if (!error && data) {
      // Si passé : marquer la leçon comme complétée
      if (passed) {
        await supabase.from('lesson_progress').upsert({
          user_id: sub.user_id,
          lesson_id: sub.lesson_id,
          course_id: courseId,
          is_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' })
      }
      setSub({ ...sub, ...data })
      setExpanded(false)
    }
    setLoading(false)
  }

  const scoreNum = parseInt(score)
  const isPassed = !isNaN(scoreNum) && scoreNum >= passingScore
  const isAlreadyGraded = sub.status === 'graded' || sub.status === 'rejected'

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
          {sub.profiles?.full_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{sub.profiles?.full_name}</p>
          <p className="text-gray-500 text-xs">{sub.lessons?.title} · {new Date(sub.submitted_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        {isAlreadyGraded && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {sub.status === 'graded' ? (
              <span className={cn('text-sm font-bold', sub.score >= passingScore ? 'text-green-400' : 'text-red-400')}>
                {sub.score}/{maxScore}
              </span>
            ) : (
              <span className="text-xs text-red-400 font-semibold">À refaire</span>
            )}
          </div>
        )}
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-5 border-t border-gray-800">
          {/* Contenu soumis */}
          <div className="mt-4 space-y-3">
            {sub.text_content && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Réponse rédigée</p>
                <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                  {sub.text_content}
                </div>
              </div>
            )}
            {sub.file_url && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Fichier joint</p>
                <a
                  href={sub.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#FFA500] hover:underline text-sm"
                >
                  <FileText className="w-4 h-4" />
                  {sub.file_name ?? 'Voir le fichier'}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Formulaire de notation */}
          {!isAlreadyGraded && (
            <div className="mt-5 space-y-3 border-t border-gray-800 pt-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setAction('grade')}
                  className={cn('flex-1 py-2 rounded-lg text-sm font-semibold transition-colors', action === 'grade' ? 'bg-[#0B3D91] text-white' : 'bg-gray-800 text-gray-400 hover:text-white')}
                >
                  <CheckCircle className="w-4 h-4 inline mr-1.5" />
                  Noter
                </button>
                <button
                  onClick={() => setAction('reject')}
                  className={cn('flex-1 py-2 rounded-lg text-sm font-semibold transition-colors', action === 'reject' ? 'bg-red-900 text-red-300' : 'bg-gray-800 text-gray-400 hover:text-white')}
                >
                  <XCircle className="w-4 h-4 inline mr-1.5" />
                  À refaire
                </button>
              </div>

              {action === 'grade' && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Note (sur {maxScore})</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={maxScore}
                      value={score}
                      onChange={e => setScore(e.target.value)}
                      placeholder="0"
                      className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:border-[#0B3D91]"
                    />
                    <div className={cn('text-sm font-semibold', isPassed ? 'text-green-400' : score ? 'text-red-400' : 'text-gray-500')}>
                      {isPassed ? `✓ Validé (min. ${passingScore})` : score ? `✗ Insuffisant (min. ${passingScore})` : `Minimum : ${passingScore}/${maxScore}`}
                    </div>
                  </div>
                  {!isNaN(scoreNum) && score && (
                    <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', isPassed ? 'bg-green-500' : 'bg-red-500')}
                        style={{ width: `${Math.min(100, (scoreNum / maxScore) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Commentaire / retour (visible par l'apprenant)</label>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Votre retour sur le travail de l'apprenant..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-[#0B3D91] placeholder-gray-600"
                />
              </div>

              <button
                onClick={handleGrade}
                disabled={loading || (action === 'grade' && (isNaN(scoreNum) || !score))}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#FFA500] text-black font-bold rounded-xl hover:bg-orange-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {action === 'grade' ? 'Envoyer la note' : 'Demander à refaire'}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Feedback existant si déjà noté */}
          {isAlreadyGraded && sub.feedback && (
            <div className="mt-4 p-3 bg-gray-800 rounded-xl text-sm text-gray-300 border-t border-gray-700 pt-4">
              <p className="text-xs text-gray-500 mb-1">Votre retour</p>
              <p className="whitespace-pre-wrap">{sub.feedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
