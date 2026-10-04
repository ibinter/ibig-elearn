'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Send, MessageSquare, Users, Pin, HelpCircle } from 'lucide-react'
import Link from 'next/link'

interface Message {
  id: string
  user_id: string
  message: string
  is_pinned: boolean
  is_question: boolean
  created_at: string
  profiles?: { full_name: string; avatar_url: string | null }
}

interface Props {
  sessionId: string
  session: {
    title: string; description?: string; platform: string; room_name: string; join_url?: string
    scheduled_at: string; duration_minutes: number; status: string; recording_url?: string
    instructor: { id: string; full_name: string }; course?: { id: string; title: string }
  }
  userId: string
  userName: string
  userAvatar: string | null
  isInstructor: boolean
}

declare global { interface Window { JitsiMeetExternalAPI: any } }

export default function JitsiRoom({ sessionId, session, userId, userName, userAvatar, isInstructor }: Props) {
  const jitsiRef = useRef<HTMLDivElement>(null)
  const apiRef    = useRef<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [isQuestion, setIsQuestion] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [participantCount, setParticipantCount] = useState(1)
  const supabase = createClient()

  // Charger Jitsi si plateforme = jitsi
  useEffect(() => {
    if (session.platform !== 'jitsi') return
    if (typeof window === 'undefined') return

    const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN ?? 'meet.jit.si'

    const loadJitsi = () => {
      if (!jitsiRef.current) return
      apiRef.current = new window.JitsiMeetExternalAPI(domain, {
        roomName: session.room_name,
        parentNode: jitsiRef.current,
        userInfo: { displayName: userName, email: '' },
        configOverwrite: {
          startWithAudioMuted: !isInstructor,
          startWithVideoMuted: !isInstructor,
          disableDeepLinking: true,
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_BUTTONS: ['microphone','camera','desktop','chat','tileview','hangup'],
        },
      })
      apiRef.current.addEventListener('participantJoined', () =>
        setParticipantCount(c => c + 1))
      apiRef.current.addEventListener('participantLeft', () =>
        setParticipantCount(c => Math.max(1, c - 1)))
    }

    if (window.JitsiMeetExternalAPI) {
      loadJitsi()
    } else {
      const script = document.createElement('script')
      script.src = `https://${domain}/external_api.js`
      script.async = true
      script.onload = loadJitsi
      document.head.appendChild(script)
    }

    return () => { apiRef.current?.dispose?.() }
  }, [session.room_name, session.platform, userName, isInstructor])

  // Charger messages + Realtime
  useEffect(() => {
    supabase
      .from('live_chat_messages')
      .select('*, profiles:user_id(full_name, avatar_url)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => setMessages((data as any) ?? []))

    const channel = supabase
      .channel(`live_chat_${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'live_chat_messages',
        filter: `session_id=eq.${sessionId}`,
      }, async payload => {
        const { data } = await supabase
          .from('live_chat_messages')
          .select('*, profiles:user_id(full_name, avatar_url)')
          .eq('id', payload.new.id)
          .single()
        if (data) setMessages(prev => [...prev, data as any])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  const sendMessage = useCallback(async () => {
    if (!newMsg.trim()) return
    await supabase.from('live_chat_messages').insert({
      session_id: sessionId,
      user_id: userId,
      message: newMsg.trim(),
      is_question: isQuestion,
    })
    setNewMsg('')
    setIsQuestion(false)
  }, [newMsg, sessionId, userId, isQuestion])

  const pinMessage = useCallback(async (msgId: string, pinned: boolean) => {
    if (!isInstructor) return
    await supabase.from('live_chat_messages').update({ is_pinned: !pinned }).eq('id', msgId)
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_pinned: !pinned } : m))
  }, [isInstructor])

  const pinned = messages.filter(m => m.is_pinned)

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Zone principale : Jitsi ou lien externe */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 border-b border-gray-700 flex-shrink-0">
          <Link href="/sessions-live" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{session.title}</p>
            {session.course && <p className="text-xs text-gray-400 truncate">{session.course.title}</p>}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{participantCount}</span>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 font-semibold">En direct</span>
          </div>
          <button onClick={() => setShowChat(!showChat)}
            className="p-2 text-gray-400 hover:text-white transition-colors">
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>

        {/* Messages épinglés */}
        {pinned.length > 0 && (
          <div className="px-4 py-2 bg-yellow-900/30 border-b border-yellow-700/30 space-y-1">
            {pinned.map(m => (
              <div key={m.id} className="flex items-start gap-2 text-xs text-yellow-200">
                <Pin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{(m.profiles as any)?.full_name} :</span>
                <span>{m.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Iframe Jitsi ou lien */}
        {session.platform === 'jitsi' ? (
          <div ref={jitsiRef} className="flex-1 w-full" />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-400 mb-4">Cette session se déroule sur une plateforme externe.</p>
              <a href={session.join_url} target="_blank" rel="noopener noreferrer"
                className="bg-[#0B3D91] hover:bg-[#0a3480] text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors inline-flex items-center gap-2">
                Rejoindre la session
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Chat */}
      {showChat && (
        <div className="w-80 flex-shrink-0 border-l border-gray-700 flex flex-col bg-gray-850">
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <span className="font-semibold text-sm">Chat en direct</span>
            <span className="text-xs text-gray-400">{messages.length} messages</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map(m => {
              const p = m.profiles as any
              const initials = (p?.full_name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()
              const isMe = m.user_id === userId
              return (
                <div key={m.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0B3D91] to-[#FFA500] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {p?.avatar_url ? <img src={p.avatar_url} className="w-full h-full rounded-full object-cover" alt="" /> : initials}
                  </div>
                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    <span className="text-[10px] text-gray-500">{p?.full_name ?? 'Participant'}</span>
                    <div className={`relative rounded-2xl px-3 py-2 text-sm group ${
                      m.is_question ? 'bg-yellow-800/40 border border-yellow-600/30' :
                      isMe ? 'bg-[#0B3D91]' : 'bg-gray-700'
                    }`}>
                      {m.is_question && <HelpCircle className="w-3 h-3 text-yellow-400 mb-1" />}
                      {m.message}
                      {isInstructor && !isMe && (
                        <button onClick={() => pinMessage(m.id, m.is_pinned)}
                          className="absolute -top-2 -right-2 hidden group-hover:flex w-5 h-5 bg-gray-600 rounded-full items-center justify-center hover:bg-yellow-600 transition-colors">
                          <Pin className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-700 space-y-2">
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input type="checkbox" checked={isQuestion} onChange={e => setIsQuestion(e.target.checked)}
                className="accent-yellow-400" />
              Marquer comme question ❓
            </label>
            <div className="flex gap-2">
              <input
                type="text" value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Votre message…"
                className="flex-1 bg-gray-700 text-white text-sm px-3 py-2 rounded-xl border border-gray-600 focus:outline-none focus:border-[#0B3D91]"
              />
              <button onClick={sendMessage}
                className="w-9 h-9 bg-[#0B3D91] hover:bg-[#0a3480] text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
