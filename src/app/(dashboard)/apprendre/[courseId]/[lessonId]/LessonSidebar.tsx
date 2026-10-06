'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { CheckCircle, Play, BookOpen, ClipboardList, ChevronDown, ChevronRight, ChevronLeft, Lock, Trophy } from 'lucide-react'
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
    <aside className={cn(
      'bg-[#1c1d1f] border-l border-white/8 flex-col transition-all duration-300 flex-shrink-0 hidden lg:flex',
      'sticky top-14 self-start overflow-y-auto',
      open ? 'w-80' : 'w-0 overflow-hidden'
    )} style={{ height: 'calc(100vh - 3.5rem)', minHeight: 0 }}>
      {/* Header sidebar */}
      <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#2d2f31] flex-shrink-0 sticky top-0 z-10">
        <span className="text-white font-semibold text-sm tracking-wide">Contenu du cours</span>
        <button
          onClick={() => setOpen(false)}
          className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Bouton pour rouvrir */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#0B3D91] border border-white/10 rounded-l-lg px-1.5 py-3 text-white hover:bg-[#1a56cc] z-50 shadow-lg"
          title="Afficher le menu"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {[...modules].sort((a, b) => a.position - b.position).map((mod, modIdx) => {
          const isLocked = !unlockedModules.get(mod.id)
          const pct = moduleProgress(mod)
          const isExpanded = expandedModules.has(mod.id)
          return (
            <div key={mod.id} className="border-b border-white/5">
              <button
                onClick={() => !isLocked && toggleModule(mod.id)}
                className={cn(
                  'w-full px-4 py-3.5 flex items-start gap-3 text-left transition-colors',
                  isLocked
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-white/5 cursor-pointer'
                )}
                disabled={isLocked}
              >
                {/* Numéro module */}
                <span className={cn(
                  'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5',
                  isLocked
                    ? 'bg-gray-700 text-gray-500'
                    : pct === 100
                      ? 'bg-green-500 text-white'
                      : 'bg-[#0B3D91] text-white'
                )}>
                  {isLocked ? <Lock className="w-3 h-3" /> : pct === 100 ? '✓' : modIdx + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <span className={cn(
                    'text-sm font-medium leading-snug block',
                    isLocked ? 'text-gray-500' : 'text-gray-100'
                  )}>
                    {mod.title}
                  </span>
                  {!isLocked && pct > 0 && (
                    <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0B3D91] to-emerald-400 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                  {isLocked && (
                    <p className="text-xs text-gray-600 mt-0.5">Terminez le module précédent</p>
                  )}
                </div>

                {!isLocked && (
                  isExpanded
                    ? <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
                    : <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
                )}
              </button>

              {!isLocked && isExpanded && (
                <div className="pb-1">
                  {(mod.lessons ?? [])
                    .slice()
                    .sort((a: any, b: any) => a.position - b.position)
                    .map((lesson: any, lessonIdx: number) => {
                      const isCurrent = lesson.id === currentLessonId
                      const isDone = completedLessons.has(lesson.id)
                      const isQuizPassed = lesson.type === 'quiz' && passedQuizLessons.has(lesson.id)
                      return (
                        <Link
                          key={lesson.id}
                          href={`/apprendre/${courseId}/${lesson.id}`}
                          className={cn(
                            'flex items-start gap-3 pl-5 pr-4 py-2.5 text-sm transition-all group relative',
                            isCurrent
                              ? 'bg-[#0B3D91]/30 border-l-2 border-[#FFA500]'
                              : 'border-l-2 border-transparent hover:bg-white/5 hover:border-white/20'
                          )}
                        >
                          {/* Icône état */}
                          <div className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                            isDone || isQuizPassed
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : isCurrent
                                ? 'bg-[#FFA500]/20 text-[#FFA500]'
                                : 'bg-white/5 text-gray-500 group-hover:text-gray-400'
                          )}>
                            {isDone || isQuizPassed
                              ? <CheckCircle className="w-3.5 h-3.5" />
                              : typeIcon(lesson.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className={cn(
                              'leading-snug block text-[13px]',
                              isCurrent ? 'text-white font-medium' : 'text-gray-400 group-hover:text-gray-200'
                            )}>
                              {lesson.title}
                            </span>
                            {lesson.type === 'quiz' && isQuizPassed && (
                              <span className="text-[11px] text-emerald-400 font-medium">Quiz validé ✓</span>
                            )}
                            {lesson.type === 'quiz' && !isQuizPassed && (
                              <span className="text-[11px] text-amber-500">Requis pour avancer</span>
                            )}
                            {lesson.type === 'final_exam' && (
                              <span className="text-[11px] text-[#FFA500] font-semibold">🏆 Examen final</span>
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
