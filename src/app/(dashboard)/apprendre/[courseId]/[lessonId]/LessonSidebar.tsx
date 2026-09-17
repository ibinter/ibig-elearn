'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle, Play, BookOpen, ClipboardList, ChevronDown, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Props {
  modules: any[]
  courseId: string
  currentLessonId: string
  userId: string
}

export default function LessonSidebar({ modules, courseId, currentLessonId, userId }: Props) {
  const [open, setOpen] = useState(true)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    supabase.from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .then(({ data }) => {
        if (data) setCompletedLessons(new Set(data.map(d => d.lesson_id)))
      })
    // Expand module contenant la leçon courante
    for (const mod of modules) {
      if (mod.lessons?.some((l: any) => l.id === currentLessonId)) {
        setExpandedModules(new Set([mod.id]))
      }
    }
  }, [currentLessonId])

  const typeIcon = (type: string) => {
    if (type === 'video') return <Play className="w-3.5 h-3.5" />
    if (type === 'quiz') return <ClipboardList className="w-3.5 h-3.5" />
    return <BookOpen className="w-3.5 h-3.5" />
  }

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <aside className={cn('bg-gray-850 border-r border-gray-700 flex flex-col transition-all duration-300', open ? 'w-72' : 'w-0 overflow-hidden')}>
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <span className="text-white font-semibold text-sm">Contenu du cours</span>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white text-xs">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {modules.map(mod => (
          <div key={mod.id} className="border-b border-gray-700">
            <button
              onClick={() => toggleModule(mod.id)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
            >
              <span className="text-gray-200 text-sm font-medium leading-snug">{mod.title}</span>
              {expandedModules.has(mod.id) ? (
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>
            {expandedModules.has(mod.id) && (
              <div>
                {(mod.lessons ?? []).map((lesson: any) => {
                  const isCurrent = lesson.id === currentLessonId
                  const isDone = completedLessons.has(lesson.id)
                  return (
                    <Link key={lesson.id} href={`/apprendre/${courseId}/${lesson.id}`}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 text-sm transition-colors',
                        isCurrent ? 'bg-[#0B3D91]/40 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                      )}>
                      <div className={cn('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                        isDone ? 'text-green-400' : isCurrent ? 'text-[#FFA500]' : 'text-gray-600')}>
                        {isDone ? <CheckCircle className="w-4 h-4" /> : typeIcon(lesson.type)}
                      </div>
                      <span className="leading-snug">{lesson.title}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}
