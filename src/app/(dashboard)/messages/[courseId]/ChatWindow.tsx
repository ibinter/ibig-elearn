'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string; content: string; is_read: boolean; created_at: string; sender_id: string
}

interface Props {
  courseId: string
  recipientId: string
  currentUserId: string
  initialMessages: Message[]
}

export default function ChatWindow({ courseId, recipientId, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Supabase Realtime — écoute les nouveaux messages de cette conversation
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${courseId}:${recipientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `course_id=eq.${courseId}`,
        },
        (payload) => {
          const msg = payload.new as Message
          // N'ajouter que les messages de l'autre partie (les nôtres sont déjà ajoutés localement)
          if (msg.sender_id !== currentUserId) {
            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev
              return [...prev, msg]
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [courseId, recipientId, currentUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, recipientId, content: text.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setMessages(prev => [...prev, { ...data, sender_id: currentUserId }])
      setText('')
    }
    setSending(false)
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
  function formatDay(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  }

  // Regrouper par jour
  const grouped: { day: string; msgs: Message[] }[] = []
  for (const m of messages) {
    const d = formatDay(m.created_at)
    if (!grouped.length || grouped[grouped.length - 1].day !== d) {
      grouped.push({ day: d, msgs: [m] })
    } else {
      grouped[grouped.length - 1].msgs.push(m)
    }
  }

  return (
    <div className="flex flex-col flex-1 bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">Commencez la conversation</p>
        )}
        {grouped.map(g => (
          <div key={g.day}>
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">{g.day}</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="space-y-2">
              {g.msgs.map(m => {
                const isMe = m.sender_id === currentUserId
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe ? 'bg-[#0B3D91] text-white rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}>
                      <p>{m.content}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>{formatTime(m.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="p-3 border-t border-gray-100 flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Écrivez votre message..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e as any) } }}
        />
        <button type="submit" disabled={!text.trim() || sending}
          className="w-11 h-11 ibig-gradient text-white rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity flex-shrink-0">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  )
}
