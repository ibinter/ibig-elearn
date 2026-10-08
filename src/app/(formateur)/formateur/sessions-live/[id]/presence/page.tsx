import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ClipboardCheck } from 'lucide-react'
import AttendanceList from './AttendanceList'

export const metadata = { title: 'Émargement' }

/** Feuille de présence d'une session live : inscrits + apprenants de la formation. */
export default async function PresencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const admin = createAdminClient()
  const [{ data: session }, { data: me }] = await Promise.all([
    admin.from('live_sessions').select('id, title, scheduled_at, duration_minutes, course_id, instructor_id').eq('id', id).maybeSingle(),
    admin.from('profiles').select('role').eq('id', user.id).single(),
  ])
  if (!session) notFound()
  if (session.instructor_id !== user.id && !['admin', 'coordinateur'].includes(me?.role ?? '')) redirect('/formateur/sessions-live')

  const [{ data: regs }, { data: enrolled }] = await Promise.all([
    admin.from('live_registrations').select('user_id, attended, join_time').eq('session_id', id),
    session.course_id ? admin.from('enrollments').select('user_id').eq('course_id', session.course_id) : Promise.resolve({ data: [] as { user_id: string }[] }),
  ])
  const ids = [...new Set([...(regs ?? []).map(r => r.user_id), ...(enrolled ?? []).map(e => e.user_id)])].filter(x => x !== session.instructor_id)
  const { data: people } = ids.length ? await admin.from('profiles').select('id, full_name, email').in('id', ids) : { data: [] }
  const reg = new Map((regs ?? []).map(r => [r.user_id, r]))
  const rows = (people ?? []).map(p => ({
    userId: p.id, name: p.full_name ?? p.email ?? '—', email: p.email ?? '',
    registered: reg.has(p.id), attended: !!reg.get(p.id)?.attended, joinTime: reg.get(p.id)?.join_time ?? null,
  })).sort((a, b) => Number(b.attended) - Number(a.attended) || a.name.localeCompare(b.name))

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link href="/formateur/sessions-live" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0B3D91]"><ArrowLeft className="w-4 h-4" /> Sessions live</Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><ClipboardCheck className="w-6 h-6 text-[#0B3D91]" /> Émargement</h1>
        <p className="text-gray-500 text-sm">{session.title} · {new Date(session.scheduled_at).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}</p>
        <p className="text-xs text-gray-400 mt-1">Les apprenants qui ouvrent la session sont marqués présents automatiquement ; corrigez si besoin.</p>
      </div>
      <AttendanceList sessionId={id} title={session.title} rows={rows} />
    </div>
  )
}
