'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Send, Loader2 } from 'lucide-react'
import DiscussionThread from './DiscussionThread'
import { createClient } from '@/lib/supabase/client'

interface Post {
  id: string
  content: string
  likes_count: number
  is_pinned: boolean
  created_at: string
  parent_id: string | null
  user: { full_name: string; avatar_url?: string }
  replies?: Post[]
  myLike?: boolean
}

interface Props {
  lessonId: string
  courseId: string
  currentUserId?: string
}

export default function DiscussionPanel({ lessonId, courseId, currentUserId }: Props) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('discussions')
        .select('*, user:profiles(full_name, avatar_url)')
        .eq('lesson_id', lessonId)
        .is('parent_id', null)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50)

      // Charger les réponses
      const roots = data ?? []
      if (roots.length > 0) {
        const { data: replies } = await supabase
          .from('discussions')
          .select('*, user:profiles(full_name, avatar_url)')
          .eq('lesson_id', lessonId)
          .not('parent_id', 'is', null)
          .order('created_at', { ascending: true })

        // Charger mes likes
        let myLikes: string[] = []
        if (currentUserId) {
          const { data: likes } = await supabase
            .from('discussion_likes')
            .select('discussion_id')
            .eq('user_id', currentUserId)
          myLikes = likes?.map(l => l.discussion_id) ?? []
        }

        const replyMap: Record<string, Post[]> = {}
        ;(replies ?? []).forEach((r: any) => {
          if (!replyMap[r.parent_id]) replyMap[r.parent_id] = []
          replyMap[r.parent_id].push({ ...r, myLike: myLikes.includes(r.id) })
        })

        setPosts(roots.map((p: any) => ({
          ...p,
          myLike: myLikes.includes(p.id),
          replies: replyMap[p.id] ?? [],
        })))
      } else {
        setPosts([])
      }
      setLoading(false)
    }
    load()
  }, [lessonId, courseId, currentUserId, supabase])

  async function submit() {
    if (!text.trim() || submitting) return
    setSubmitting(true)
    const res = await fetch('/api/discussions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, courseId, content: text }),
    })
    if (res.ok) {
      const newPost = await res.json()
      setPosts(p => [{ ...newPost, replies: [], myLike: false }, ...p])
      setText('')
    }
    setSubmitting(false)
  }

  function handleReplyPosted(reply: Post, parentId: string) {
    setPosts(p => p.map(post =>
      post.id === parentId
        ? { ...post, replies: [...(post.replies ?? []), reply] }
        : post
    ))
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-5">
        <MessageSquare className="w-5 h-5 text-[#0B3D91]" />
        <h3 className="font-bold text-white text-lg">Discussion ({posts.length})</h3>
      </div>

      {/* Formulaire nouveau post */}
      {currentUserId ? (
        <div className="flex gap-3 mb-6">
          <div className="w-8 h-8 rounded-full ibig-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
            Moi
          </div>
          <div className="flex-1">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Posez votre question ou partagez votre insight sur cette leçon…"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/50 resize-none"
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) submit() }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">Ctrl+Entrée pour envoyer</span>
              <button
                onClick={submit}
                disabled={!text.trim() || submitting}
                className="flex items-center gap-1.5 ibig-gradient text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40 hover:opacity-90"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Publier
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl p-4 mb-6 text-center text-sm text-gray-400">
          <a href="/connexion" className="text-[#FFA500] hover:underline font-medium">Connectez-vous</a> pour participer à la discussion
        </div>
      )}

      {/* Liste des discussions */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucune discussion pour l&apos;instant.</p>
          <p className="text-xs mt-1">Soyez le premier à poser une question !</p>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map(post => (
            <DiscussionThread
              key={post.id}
              post={post}
              lessonId={lessonId}
              courseId={courseId}
              currentUserId={currentUserId}
              onReplyPosted={handleReplyPosted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
