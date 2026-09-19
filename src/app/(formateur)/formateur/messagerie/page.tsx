import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import BulkMessageForm from './BulkMessageForm'

export default async function MessageriePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, enrollments(count)')
    .eq('instructor_id', user.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const { data: history } = await supabase
    .from('bulk_messages')
    .select('*, course:courses(title)')
    .eq('instructor_id', user.id)
    .order('sent_at', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[#0B3D91]" /> Messagerie groupée
        </h1>
        <p className="text-gray-500 mt-1">Envoyez un message à tous les apprenants d&apos;une formation</p>
      </div>

      <BulkMessageForm courses={courses ?? []} />

      {history && history.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Messages envoyés</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(history as any[]).map(msg => (
              <div key={msg.id} className="px-6 py-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[#0B3D91] bg-blue-50 px-2 py-0.5 rounded-full">{msg.course?.title}</span>
                  <span className="text-xs text-gray-400">{new Date(msg.sent_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">{msg.subject}</p>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{msg.body}</p>
                <p className="text-xs text-gray-400 mt-1">{msg.recipients_count} destinataires</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
