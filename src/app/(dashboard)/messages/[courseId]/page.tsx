import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ChatWindow from './ChatWindow'

interface PageProps {
  params: Promise<{ courseId: string }>
  searchParams: Promise<{ with?: string }>
}

export default async function ConversationPage({ params, searchParams }: PageProps) {
  const { courseId } = await params
  const { with: withUserId } = await searchParams
  if (!withUserId) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: course } = await supabase.from('courses').select('id, title, slug').eq('id', courseId).single()
  const { data: otherProfile } = await supabase.from('profiles').select('id, full_name, role').eq('id', withUserId).single()

  if (!course || !otherProfile) notFound()

  // Historique initial
  const { data: initialMessages } = await supabase
    .from('messages')
    .select('id, content, is_read, created_at, sender_id')
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${withUserId}),and(sender_id.eq.${withUserId},recipient_id.eq.${user.id})`)
    .eq('course_id', courseId)
    .order('created_at', { ascending: true })
    .limit(100)

  // Marquer comme lus
  await supabase.from('messages')
    .update({ is_read: true })
    .eq('course_id', courseId)
    .eq('recipient_id', user.id)
    .eq('sender_id', withUserId)

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <Link href="/messages" className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-10 h-10 rounded-full bg-[#0B3D91]/10 flex items-center justify-center font-bold text-[#0B3D91] flex-shrink-0">
          {otherProfile.full_name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{otherProfile.full_name}</p>
          <p className="text-xs text-gray-400">{course.title}</p>
        </div>
      </div>

      <ChatWindow
        courseId={courseId}
        recipientId={withUserId}
        currentUserId={user.id}
        initialMessages={initialMessages ?? []}
      />
    </div>
  )
}
