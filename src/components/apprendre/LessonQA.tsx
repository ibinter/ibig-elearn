'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, ThumbsUp, ChevronDown, ChevronUp, Send, Loader2 } from 'lucide-react'

interface QAItem {
  id: string
  question: string
  answer: string | null
  upvotes: number
  created_at: string
  user: { full_name: string; avatar_url: string | null }
  answered_by: { full_name: string } | null
  my_upvote?: boolean
}

export default function LessonQA({ lessonId, courseId, userId }: { lessonId: string; courseId: string; userId: string }) {
  const [items, setItems] = useState<QAItem[]>([])
  const [question, setQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('lesson_qa')
      .select('*, user:profiles!lesson_qa_user_id_fkey(full_name, avatar_url), answered_by:profiles!lesson_qa_answered_by_fkey(full_name)')
      .eq('lesson_id', lessonId)
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: false })
    if (data) {
      const { data: myVotes } = await supabase.from('qa_upvotes').select('qa_id').eq('user_id', userId)
      const voteSet = new Set(myVotes?.map(v => v.qa_id))
      setItems(data.map((item: any) => ({ ...item, my_upvote: voteSet.has(item.id) })))
    }
  }, [lessonId, userId, supabase])

  useEffect(() => { load() }, [load])

  async function submitQuestion() {
    if (!question.trim()) return
    setSubmitting(true)
    await supabase.from('lesson_qa').insert({ lesson_id: lessonId, course_id: courseId, user_id: userId, question: question.trim() })
    setQuestion('')
    await load()
    setSubmitting(false)
  }

  async function toggleUpvote(item: QAItem) {
    if (item.my_upvote) {
      await supabase.from('qa_upvotes').delete().eq('qa_id', item.id).eq('user_id', userId)
      await supabase.from('lesson_qa').update({ upvotes: item.upvotes - 1 }).eq('id', item.id)
    } else {
      await supabase.from('qa_upvotes').insert({ qa_id: item.id, user_id: userId })
      await supabase.from('lesson_qa').update({ upvotes: item.upvotes + 1 }).eq('id', item.id)
    }
    await load()
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-[#0B3D91]" />
        Questions & Réponses
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{items.length}</span>
      </h3>

      {/* Poser une question */}
      <div className="flex gap-2">
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Posez votre question sur cette leçon..."
          rows={2}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91] resize-none"
        />
        <button
          onClick={submitQuestion}
          disabled={submitting || !question.trim()}
          className="flex-shrink-0 bg-[#0B3D91] text-white rounded-xl px-4 flex items-center gap-1.5 text-sm font-medium disabled:opacity-50 hover:bg-blue-800 transition-colors"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      {/* Liste des questions */}
      {items.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">Aucune question pour cette leçon. Soyez le premier !</p>
      )}

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0B3D91] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {item.user?.full_name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-1">{item.user?.full_name} · {new Date(item.created_at).toLocaleDateString('fr-FR')}</p>
                  <p className="text-sm text-gray-800 font-medium">{item.question}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3 pl-11">
                <button
                  onClick={() => toggleUpvote(item)}
                  className={`flex items-center gap-1 text-xs rounded-full px-2 py-1 transition-colors ${item.my_upvote ? 'bg-blue-100 text-[#0B3D91]' : 'text-gray-400 hover:text-[#0B3D91] hover:bg-blue-50'}`}
                >
                  <ThumbsUp className="w-3 h-3" /> {item.upvotes}
                </button>
                {item.answer && (
                  <button
                    onClick={() => setExpanded(prev => { const n = new Set(prev); n.has(item.id) ? n.delete(item.id) : n.add(item.id); return n })}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                  >
                    {expanded.has(item.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Voir la réponse
                  </button>
                )}
              </div>

              {item.answer && expanded.has(item.id) && (
                <div className="mt-3 ml-11 p-3 bg-green-50 border border-green-100 rounded-xl">
                  <p className="text-xs text-green-600 font-semibold mb-1">
                    {item.answered_by?.full_name ?? 'Formateur'}
                  </p>
                  <p className="text-sm text-gray-700">{item.answer}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
