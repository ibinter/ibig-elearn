'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Lesson {
  id: string
  title: string
}

interface Props {
  courseId: string
  prevLesson: Lesson | null
  nextLesson: Lesson | null
}

export default function LessonNavigation({ courseId, prevLesson, nextLesson }: Props) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-700">
      {prevLesson ? (
        <button
          onClick={() => router.push(`/apprendre/${courseId}/${prevLesson.id}`)}
          className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors text-sm font-medium group max-w-[45%]"
        >
          <ChevronLeft className="w-4 h-4 flex-shrink-0 text-gray-400 group-hover:text-white transition-colors" />
          <div className="text-left min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Précédent</p>
            <p className="truncate">{prevLesson.title}</p>
          </div>
        </button>
      ) : <div />}

      {nextLesson ? (
        <button
          onClick={() => router.push(`/apprendre/${courseId}/${nextLesson.id}`)}
          className="flex items-center gap-2 px-4 py-3 bg-[#0B3D91] hover:bg-[#0a2f70] text-white rounded-xl transition-colors text-sm font-medium group max-w-[45%] ml-auto"
        >
          <div className="text-right min-w-0">
            <p className="text-[10px] text-blue-200 uppercase tracking-wider">Suivant</p>
            <p className="truncate">{nextLesson.title}</p>
          </div>
          <ChevronRight className="w-4 h-4 flex-shrink-0 text-blue-300 group-hover:text-white transition-colors" />
        </button>
      ) : <div />}
    </div>
  )
}
