'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { CheckCircle, Play, BookOpen, ClipboardList, ChevronDown, ChevronRight, Lock, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Props {
  modules: any[]
  courseId: string
  currentLessonId: string
  userId: string
  enrollmentMode?: 'autonome' | 'guide' | 'certifiant'
}

export default function LessonSidebar({ modules, courseId, currentLessonId, userId, enrollmentMode = 'autonome' }: Props) {
  const [open, setOpen] = useState(true)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [passedQuizLessons, setPassedQuizLessons] = useState<Set<string>>(new Set())
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [{ data: progress }, { data: attempts }] = await Promise.all([
        supabase.from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', userId)
          .eq('is_completed', true),
        supabase.from('quiz_attempts')
          .select('lesson_id, score')
          .eq('user_id', userId)
          .gte('score', 70),
      ])
      if (progress) setCompletedLessons(new Set(progress.map(d => d.lesson_id)))
      if (attempts) setPassedQuizLessons(new Set(attempts.map(d => d.lesson_id)))
    }
    load()

    // Expand module containing current lesson
    for (const mod of modules) {
      if (mod.lessons?.some((l: any) => l.id === currentLessonId)) {
        setExpandedModules(new Set([mod.id]))
      }
    }
  }, [currentLessonId])

  // Build unlock map: moduleId -> boolean
  const unlockedModules = useMemo(() => {
    const sorted = [...modules].sort((a, b) => a.position - b.position)
    const map = new Map<string, boolean>()

    sorted.forEach((mod, idx) => {
      if (enrollmentMode === 'autonome' || idx === 0) {
        map.set(mod.id, true)
        return
      }
      const prevMod = sorted[idx - 1]
      // Find quiz lesson in previous module
      const prevLessons: any[] = prevMod.lessons ?? []
      const quizLesson = prevLessons
        .slice()
        .sort((a: any, b: any) => b.position - a.position)
        .find((l: any) => l.type === 'quiz')

      if (quizLesson) {
        map.set(mod.id, passedQuizLessons.has(quizLesson.id))
      } else {
        // No quiz: all lessons in prev module must be completed
        const allDone = prevLessons.every((l: any) => completedLessons.has(l.id))
        map.set(mod.id, allDone)
      }
    })

    return map
  }, [modules, enrollmentMode, passedQuizLessons, completedLessons])

  const typeIcon = (type: string) => {
    if (type === 'video') return <Play className="w-3.5 h-3.5" />
    if (type === 'audio') return <span className="text-xs">🎧</span>
    if (type === 'code') return <span className="text-xs">💻</span>
    if (type === 'quiz') return <ClipboardList className="w-3.5 h-3.5" />
    if (type === 'final_exam') return <Trophy className="w-3.5 h-3.5 text-[#FFA500]" />
    return <BookOpen className="w-3.5 h-3.5" />
  }

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Module completion % for progress display
  const moduleProgress = (mod: any) => {
    const lessons: any[] = mod.lessons ?? []
    if (!lessons.length) return 0
    const done = lessons.filter((l: any) => completedLessons.has(l.id)).length
    return Math.round((done / lessons.length) * 100)
  }

  return (
    <aside className={cn('bg-gray-850 border-r border-gray-700 flex flex-col transition-all duration-300', open ? 'w-72' : 'w-0 overflow-hidden')}>
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <span className="text-white font-semibold text-sm">Contenu du cours</span>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white text-xs">✕</button>
      </div>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-800 border border-gray-700 rounded-r-lg p-2 text-gray-400 hover:text-white z-10"
          title="Afficher le menu"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
      <div className="flex-1 overflow-y-auto">
        {[...modules].sort((a, b) => a.position - b.position).map(mod => {
          const isLocked = !unlockedModules.get(mod.id)
          const pct = moduleProgress(mod)
          return (
            <div key={mod.id} className="border-b border-gray-700">
              <button
                onClick={() => toggleModule(mod.id)}
                className={cn(
                  'w-full px-4 py-3 flex items-center justify-between text-left transition-colors',
                  isLocked ? 'opacity-60 cursor-not-allowed hover:bg-transparent' : 'hover:bg-gray-800'
                )}
                disabled={isLocked}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isLocked && <Lock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />}
                    <span className="text-gray-200 text-sm font-medium leading-snug truncate">{mod.title}</span>
                  </div>
                  {!isLocked && pct > 0 && (
                    <div className="mt-1.5 h-1 bg-gray-700 rounded-full overflow-hidden w-full">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                  {isLocked && (
                    <p className="text-xs text-gray-500 mt-0.5">Terminez le module précédent</p>
                  )}
                </div>
                {!isLocked && (
                  expandedModules.has(mod.id)
                    ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                    : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                )}
              </button>

              {!isLocked && expandedModules.has(mod.id) && (
                <div>
                  {(mod.lessons ?? [])
                    .slice()
                    .sort((a: any, b: any) => a.position - b.position)
                    .map((lesson: any) => {
                      const isCurrent = lesson.id === currentLessonId
                      const isDone = completedLessons.has(lesson.id)
                      const isQuizPassed = lesson.type === 'quiz' && passedQuizLessons.has(lesson.id)
                      return (
                        <Link
                          key={lesson.id}
                          href={`/apprendre/${courseId}/${lesson.id}`}
                          className={cn(
                            'flex items-start gap-3 px-4 py-3 text-sm transition-colors',
                            isCurrent
                              ? 'bg-[#0B3D91]/40 text-white'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                          )}
                        >
                          <div className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                            isDone || isQuizPassed
                              ? 'text-green-400'
                              : isCurrent
                                ? 'text-[#FFA500]'
                                : 'text-gray-600'
                          )}>
                            {isDone || isQuizPassed
                              ? <CheckCircle className="w-4 h-4" />
                              : typeIcon(lesson.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="leading-snug block">{lesson.title}</span>
                            {lesson.type === 'quiz' && isQuizPassed && (
                              <span className="text-xs text-green-400">Quiz validé ✓</span>
                            )}
                            {lesson.type === 'quiz' && !isQuizPassed && (
                              <span className="text-xs text-yellow-500">Requis pour avancer</span>
                            )}
                            {lesson.type === 'final_exam' && (
                              <span className="text-xs text-[#FFA500] font-semibold">Examen final 🏆</span>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
