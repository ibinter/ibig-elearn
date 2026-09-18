import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, BookOpen } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isFormateur = ['formateur', 'admin', 'coordinateur'].includes(profile?.role ?? '')

  // Conversations : derniers messages par (course_id, interlocuteur)
  const { data: messages } = await supabase
    .from('messages')
    .select('id, content, is_read, created_at, course_id, sender_id, recipient_id, course:courses(title, slug), sender:profiles!sender_id(full_name), recipient:profiles!recipient_id(full_name)')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(100)

  // Grouper par (course_id, interlocuteur)
  type ConvKey = string
  const convMap = new Map<ConvKey, typeof messages extends (infer T)[] | null ? T : never>()
  for (const m of messages ?? []) {
    if (!m) continue
    const other = m.sender_id === user.id ? m.recipient_id : m.sender_id
    const key = `${m.course_id}__${other}`
    if (!convMap.has(key)) convMap.set(key, m)
  }
  const conversations = Array.from(convMap.values())

  const unreadCount = (messages ?? []).filter(m => m && m.recipient_id === user.id && !m.is_read).length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-[#0B3D91]" /> Messages
        </h1>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount} non lu{unreadCount > 1 ? 's' : ''}</span>
        )}
      </div>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-700 mb-1">Aucun message</p>
          <p className="text-gray-400 text-sm">
            {isFormateur ? 'Vos apprenants peuvent vous envoyer des messages depuis leurs formations.' : 'Posez vos questions à votre formateur depuis la page de formation.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {conversations.map((conv, i) => {
            if (!conv) return null
            const other = conv.sender_id === user.id ? conv.recipient_id : conv.sender_id
            const otherName = conv.sender_id === user.id ? (conv.recipient as any)?.full_name : (conv.sender as any)?.full_name
            const unread = (messages ?? []).some(m => m && m.course_id === conv.course_id && m.sender_id === other && m.recipient_id === user.id && !m.is_read)
            return (
              <Link key={i}
                href={`/messages/${conv.course_id}?with=${other}`}
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${unread ? 'bg-blue-50/50' : ''}`}>
                <div className="w-11 h-11 rounded-full bg-[#0B3D91]/10 flex items-center justify-center font-bold text-[#0B3D91] flex-shrink-0">
                  {otherName?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${unread ? 'text-gray-900' : 'text-gray-700'}`}>{otherName}</p>
                    {unread && <span className="w-2 h-2 rounded-full bg-[#0B3D91] flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <BookOpen className="w-3 h-3" />
                    <span className="truncate">{(conv.course as any)?.title}</span>
                  </p>
                  <p className={`text-xs mt-0.5 truncate ${unread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{conv.content}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(conv.created_at)}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
