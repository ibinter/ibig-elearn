'use client'

import { useState } from 'react'
import { Heart, Reply, ChevronDown, ChevronUp, Pin } from 'lucide-react'
import { formatDate } from '@/lib/utils'

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
  post: Post
  lessonId: string
  courseId: string
  currentUserId?: string
  onReplyPosted: (reply: Post, parentId: string) => void
}

export default function DiscussionThread({ post, lessonId, courseId, currentUserId, onReplyPosted }: Props) {
  const [liked, setLiked] = useState(post.myLike ?? false)
  const [likeCount, setLikeCount] = useState(post.likes_count)
  const [showReplies, setShowReplies] = useState(true)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function toggleLike() {
    if (!currentUserId) return
    const prev = liked
    setLiked(!liked)
    setLikeCount(c => c + (liked ? -1 : 1))
    const res = await fetch('/api/discussions/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discussionId: post.id }),
    })
    if (!res.ok) { setLiked(prev); setLikeCount(c => c + (prev ? 1 : -1)) }
  }

  async function submitReply() {
    if (!replyText.trim() || submitting) return
    setSubmitting(true)
    const res = await fetch('/api/discussions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, courseId, content: replyText, parentId: post.id }),
    })
    if (res.ok) {
      const newReply = await res.json()
      onReplyPosted(newReply, post.id)
      setReplyText('')
      setShowReplyForm(false)
    }
    setSubmitting(false)
  }

  const initials = post.user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#0B3D91] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        {/* Bulle */}
        <div className={`bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 ${post.is_pinned ? 'border border-[#FFA500]/30 bg-[#FFA500]/5' : ''}`}>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{post.user?.full_name}</span>
            {post.is_pinned && (
              <span className="flex items-center gap-1 text-[10px] text-[#FFA500] font-semibold">
                <Pin className="w-2.5 h-2.5" /> Épinglé
              </span>
            )}
            <span className="text-xs text-gray-400">{formatDate(post.created_at)}</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-1.5 px-1">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1 text-xs transition-colors ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          {currentUserId && (
            <button
              onClick={() => setShowReplyForm(r => !r)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#0B3D91] transition-colors"
            >
              <Reply className="w-3.5 h-3.5" /> Répondre
            </button>
          )}

          {(post.replies?.length ?? 0) > 0 && (
            <button
              onClick={() => setShowReplies(r => !r)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {post.replies!.length} réponse{post.replies!.length > 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* Formulaire réponse */}
        {showReplyForm && (
          <div className="mt-2 flex gap-2">
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Votre réponse…"
              rows={2}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 resize-none"
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) submitReply() }}
            />
            <button
              onClick={submitReply}
              disabled={!replyText.trim() || submitting}
              className="ibig-gradient text-white text-xs font-semibold px-3 py-2 rounded-xl disabled:opacity-40 self-end"
            >
              Envoyer
            </button>
          </div>
        )}

        {/* Réponses imbriquées */}
        {showReplies && (post.replies?.length ?? 0) > 0 && (
          <div className="mt-3 space-y-3 pl-2 border-l-2 border-gray-100">
            {post.replies!.map(reply => (
              <DiscussionThread
                key={reply.id}
                post={reply}
                lessonId={lessonId}
                courseId={courseId}
                currentUserId={currentUserId}
                onReplyPosted={onReplyPosted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
