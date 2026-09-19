import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, BookOpen, ChevronRight, Bookmark } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function MesNotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: notes }, { data: bookmarks }] = await Promise.all([
    supabase
      .from('lesson_notes')
      .select('id, content, updated_at, lesson_id, lesson:lessons(title, type), course:courses(title, slug)')
      .eq('user_id', user.id)
      .neq('content', '')
      .order('updated_at', { ascending: false }),
    supabase
      .from('lesson_bookmarks')
      .select('lesson_id, course_id, created_at, lesson:lessons(id, title, type), course:courses(title, slug, id)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">

      {/* Marque-pages */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#0B3D91]/10 rounded-xl flex items-center justify-center">
            <Bookmark className="w-4 h-4 text-[#0B3D91]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Marque-pages</h2>
            <p className="text-sm text-gray-500">{bookmarks?.length ?? 0} leçon{(bookmarks?.length ?? 0) !== 1 ? 's' : ''} sauvegardée{(bookmarks?.length ?? 0) !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {(bookmarks?.length ?? 0) === 0 ? (
          <div className="bg-gray-50 rounded-2xl py-8 text-center text-gray-400 text-sm">
            Aucun marque-page. Utilisez le bouton 🔖 dans une leçon pour sauvegarder votre position.
          </div>
        ) : (
          <div className="space-y-2">
            {bookmarks!.map((b: any) => (
              <Link
                key={b.lesson_id}
                href={`/apprendre/${b.course?.id ?? b.course_id}/${b.lesson_id}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow px-4 py-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#0B3D91]/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-[#0B3D91]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{b.lesson?.title}</p>
                  <p className="text-xs text-gray-400">{b.course?.title}</p>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">{formatDate(b.created_at)}</div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#0B3D91] flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Notes */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Mes notes</h2>
            <p className="text-sm text-gray-500">{notes?.length ?? 0} note{(notes?.length ?? 0) !== 1 ? 's' : ''} rédigée{(notes?.length ?? 0) !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {(notes?.length ?? 0) === 0 ? (
          <div className="bg-gray-50 rounded-2xl py-8 text-center text-gray-400 text-sm">
            Aucune note. Ouvrez une leçon et utilisez le panneau &quot;Mes notes&quot; pour prendre des notes.
          </div>
        ) : (
          <div className="space-y-3">
            {notes!.map((n: any) => (
              <div key={n.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
                  <FileText className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{n.lesson?.title}</p>
                    <p className="text-xs text-gray-400">{(n.course as any)?.title}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(n.updated_at)}</span>
                  <Link
                    href={`/apprendre/${(n.course as any)?.id ?? ''}/${n.lesson_id}`}
                    className="text-xs text-[#0B3D91] hover:underline flex-shrink-0 flex items-center gap-0.5"
                  >
                    Ouvrir <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4 leading-relaxed">{n.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
