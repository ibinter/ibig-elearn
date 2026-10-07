'use client'

import { ArrowLeft, Download, FileText, BookOpen } from 'lucide-react'
import Link from 'next/link'

interface LessonNote {
  title: string
  content: string
  updatedAt: string
}
interface ModuleNotes {
  moduleTitle: string
  modulePos: number
  lessons: LessonNote[]
}
interface Props {
  courseTitle: string
  instructorName: string
  thumbnailUrl?: string | null
  modules: ModuleNotes[]
  noteCount: number
  courseId: string
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function NotesPrintView({ courseTitle, instructorName, thumbnailUrl, modules, noteCount, courseId }: Props) {
  const handlePrint = () => window.print()

  return (
    <>
      {/* Barre d'actions — masquée à l'impression */}
      <div className="print:hidden bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href={`/apprendre/${courseId}/intro`}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à la formation
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-sm">{noteCount} note{noteCount > 1 ? 's' : ''}</span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-[#FFA500] hover:bg-orange-500 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" /> Télécharger PDF
          </button>
        </div>
      </div>

      {/* Contenu imprimable */}
      <div className="max-w-3xl mx-auto px-8 py-10 print:px-12 print:py-8">

        {/* Page de couverture */}
        <div className="mb-10 pb-8 border-b-2 border-gray-200 print:mb-12 print:pb-10">
          <div className="flex items-start gap-6">
            {thumbnailUrl && (
              <img src={thumbnailUrl} alt="" className="w-24 h-16 object-cover rounded-lg flex-shrink-0 print:w-20 print:h-14" />
            )}
            <div>
              <p className="text-sm text-[#FFA500] font-semibold uppercase tracking-wider mb-1">Notes de cours — IBIG E-LEARN</p>
              <h1 className="text-2xl font-black text-gray-900 leading-tight">{courseTitle}</h1>
              {instructorName && (
                <p className="text-sm text-gray-500 mt-1">par {instructorName}</p>
              )}
              <p className="text-xs text-gray-400 mt-3">
                Généré le {formatDate(new Date().toISOString())} · {noteCount} leçon{noteCount > 1 ? 's' : ''} avec notes
              </p>
            </div>
          </div>
        </div>

        {/* Contenu vide */}
        {modules.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium text-lg">Aucune note à exporter</p>
            <p className="text-sm mt-2">Prenez des notes pendant vos leçons — elles apparaîtront ici.</p>
          </div>
        )}

        {/* Notes par module */}
        {modules.map((mod, mi) => (
          <div key={mi} className="mb-10 print:break-inside-avoid-page">
            {/* Titre module */}
            <div className="flex items-center gap-2 mb-5">
              <BookOpen className="w-5 h-5 text-[#0B3D91] flex-shrink-0" />
              <h2 className="text-lg font-bold text-[#0B3D91]">
                Module {mod.modulePos + 1} — {mod.moduleTitle}
              </h2>
            </div>

            {/* Notes des leçons */}
            <div className="space-y-6 pl-7">
              {mod.lessons.map((lesson, li) => (
                <div key={li} className="print:break-inside-avoid">
                  <h3 className="font-semibold text-gray-800 text-base mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 bg-[#FFA500]/20 text-[#FFA500] rounded flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {li + 1}
                    </span>
                    {lesson.title}
                    <span className="text-xs text-gray-400 font-normal ml-auto">{formatDate(lesson.updatedAt)}</span>
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-[#0B3D91]/30 print:bg-gray-50 print:border-l-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{lesson.content}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Pied de page imprimé */}
        <div className="hidden print:block mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
          IBIG E-LEARN — {courseTitle} — ibig-elearning.com
        </div>
      </div>

      {/* CSS print */}
      <style>{`
        @media print {
          @page { margin: 20mm 15mm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </>
  )
}
