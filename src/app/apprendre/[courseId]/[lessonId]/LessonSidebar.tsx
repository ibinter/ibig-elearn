'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { CheckCircle, Play, BookOpen, ClipboardList, ChevronDown, ChevronRight, Lock, Trophy, Headphones, Code2, FileText, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Props {
  modules: any[]
  courseId: string
  currentLessonId: string
  userId: string
  enrollmentMode?: 'autonome' | 'guide' | 'certifiant'
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  video:      <Play className="w-3.5 h-3.5" />,
  audio:      <Headphones className="w-3.5 h-3.5" />,
  code:       <Code2 className="w-3.5 h-3.5" />,
  quiz:       <ClipboardList className="w-3.5 h-3.5" />,
  final_exam: <Trophy className="w-3.5 h-3.5 text-[#FFA500]" />,
  assignment: <FileText className="w-3.5 h-3.5" />,
  lesson:     <BookOpen className="w-3.5 h-3.5" />,
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
        supabase.from('lesson_progress').select('lesson_id').eq('user_id', userId).eq('is_completed', true),
        supabase.from('quiz_attempts').select('lesson_id, score').eq('user_id', userId).gte('score', 70),
      ])
      if (progress) setCompletedLessons(new Set(progress.map((d: any) => d.lesson_id)))
      if (attempts) setPassedQuizLessons(new Set(attempts.map((d: any) => d.lesson_id)))
    }
    load()

    // Auto-expand module contenant la leçon courante
    for (const mod of modules) {
      if ((mod.lessons ?? []).some((l: any) => l.id === currentLessonId)) {
        setExpandedModules(new Set([mod.id]))
        break
      }
    }
  }, [currentLessonId])

  const unlockedModules = useMemo(() => {
    const sorted = [...modules].sort((a, b) => a.position - b.position)
    const map = new Map<string, boolean>()
    sorted.forEach((mod, idx) => {
      if (enrollmentMode === 'autonome' || idx === 0) { map.set(mod.id, true); return }
      const prevMod = sorted[idx - 1]
      const prevLessons: any[] = prevMod.lessons ?? []
      const quizLesson = prevLessons.slice().sort((a: any, b: any) => b.position - a.position).find((l: any) => l.type === 'quiz')
      if (quizLesson) {
        map.set(mod.id, passedQuizLessons.has(quizLesson.id))
      } else {
        map.set(mod.id, prevLessons.every((l: any) => completedLessons.has(l.id)))
      }
    })
    return map
  }, [modules, enrollmentMode, passedQuizLessons, completedLessons])

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const moduleStats = (mod: any) => {
    const lessons: any[] = (mod.lessons ?? [])
    const done = lessons.filter((l: any) => completedLessons.has(l.id) || (l.type === 'quiz' && passedQuizLessons.has(l.id))).length
    return { total: lessons.length, done, pct: lessons.length ? Math.round((done / lessons.length) * 100) : 0 }
  }

  // Total progression globale
  const allLessons = modules.flatMap(m => m.lessons ?? [])
  const totalDone = allLessons.filter((l: any) => completedLessons.has(l.id) || (l.type === 'quiz' && passedQuizLessons.has(l.id))).length
  const globalPct = allLessons.length ? Math.round((totalDone / allLessons.length) * 100) : 0

  return (
    <aside className={cn(
      'bg-[#1c1d1f] border-r border-white/8 flex-col transition-all duration-300 flex-shrink-0 hidden lg:flex relative',
      'sticky top-14 self-start',
      open ? 'w-[320px]' : 'w-14'
    )} style={{ height: 'calc(100vh - 3.5rem)', minHeight: 0 }}>

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="absolute -right-3.5 top-6 z-20 w-7 h-7 bg-[#2d2f31] border border-white/15 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#0B3D91] transition-all shadow-md"
        title={open ? 'Réduire' : 'Agrandir'}
      >
        {open ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
      </button>

      {open ? (
        <>
          {/* Header */}
          <div className="px-4 py-4 border-b border-white/10 bg-[#2d2f31] flex-shrink-0">
            <p className="text-white font-bold text-sm mb-3">Contenu du cours</p>
            {/* Progress global */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${globalPct}%`,
                    background: globalPct >= 100 ? '#22c55e' : 'linear-gradient(90deg,#0B3D91,#FFA500)',
                  }}
                />
              </div>
              <span className="text-xs font-bold text-gray-300 flex-shrink-0">{totalDone}/{allLessons.length}</span>
            </div>
          </div>

          {/* Liste modules */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            {[...modules].sort((a, b) => a.position - b.position).map((mod, modIdx) => {
              const isLocked = !unlockedModules.get(mod.id)
              const isExpanded = expandedModules.has(mod.id)
              const { total, done, pct } = moduleStats(mod)

              return (
                <div key={mod.id} className="border-b border-white/5">
                  {/* Module header */}
                  <button
                    onClick={() => !isLocked && toggleModule(mod.id)}
                    disabled={isLocked}
                    className={cn(
                      'w-full px-4 py-3.5 flex items-start gap-3 text-left transition-colors',
                      isLocked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'
                    )}
                  >
                    {/* Numéro / état */}
                    <span className={cn(
                      'w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5',
                      isLocked ? 'bg-gray-700 text-gray-500'
                        : pct === 100 ? 'bg-emerald-500 text-white'
                        : 'bg-[#0B3D91] text-white'
                    )}>
                      {isLocked ? <Lock className="w-3 h-3" /> : pct === 100 ? '✓' : modIdx + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className={cn('text-[13px] font-semibold leading-snug', isLocked ? 'text-gray-500' : 'text-gray-100')}>
                        {mod.title}
                      </p>
                      {!isLocked && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 bg-white/10 rounded-full h-1 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                background: pct === 100 ? '#22c55e' : 'linear-gradient(90deg,#0B3D91,#FFA500)',
                              }}
                            />
                          </div>
                          <span className="text-[11px] text-gray-500 flex-shrink-0">{done}/{total}</span>
                        </div>
                      )}
                    </div>

                    {!isLocked && (
                      isExpanded
                        ? <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1.5" />
                        : <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1.5" />
                    )}
                  </button>

                  {/* Leçons */}
                  {!isLocked && isExpanded && (
                    <div className="pb-2">
                      {(mod.lessons ?? [])
                        .slice()
                        .sort((a: any, b: any) => a.position - b.position)
                        .map((lesson: any) => {
                          const isCurrent = lesson.id === currentLessonId
                          const isDone = completedLessons.has(lesson.id) || (lesson.type === 'quiz' && passedQuizLessons.has(lesson.id))
                          return (
                            <Link
                              key={lesson.id}
                              href={`/apprendre/${courseId}/${lesson.id}`}
                              className={cn(
                                'flex items-start gap-3 pl-5 pr-4 py-2.5 transition-all group border-l-2',
                                isCurrent
                                  ? 'bg-[#0B3D91]/25 border-[#FFA500]'
                                  : 'border-transparent hover:bg-white/5 hover:border-white/20'
                              )}
                            >
                              {/* Icône état */}
                              <div className={cn(
                                'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                                isDone ? 'bg-emerald-500/20 text-emerald-400'
                                  : isCurrent ? 'bg-[#FFA500]/20 text-[#FFA500]'
                                  : 'bg-white/5 text-gray-500 group-hover:text-gray-300'
                              )}>
                                {isDone
                                  ? <CheckCircle className="w-3.5 h-3.5" />
                                  : TYPE_ICON[lesson.type] ?? <BookOpen className="w-3.5 h-3.5" />}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  'text-[12.5px] leading-snug',
                                  isCurrent ? 'text-white font-semibold' : 'text-gray-400 group-hover:text-gray-200'
                                )}>
                                  {lesson.title}
                                </p>
                                {lesson.type === 'quiz' && !isDone && (
                                  <p className="text-[11px] text-amber-500 mt-0.5">Requis pour avancer</p>
                                )}
                                {lesson.type === 'final_exam' && (
                                  <p className="text-[11px] text-[#FFA500] font-semibold mt-0.5">🏆 Examen final</p>
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
        </>
      ) : (
        /* Mode réduit : icônes uniquement */
        <div className="flex flex-col items-center pt-4 gap-3">
          {[...modules].sort((a, b) => a.position - b.position).map((mod, idx) => {
            const { pct } = moduleStats(mod)
            const hasCurrentLesson = (mod.lessons ?? []).some((l: any) => l.id === currentLessonId)
            return (
              <button
                key={mod.id}
                onClick={() => { setOpen(true); setExpandedModules(new Set([mod.id])) }}
                className={cn(
                  'w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all',
                  hasCurrentLesson ? 'ring-2 ring-[#FFA500] bg-[#0B3D91] text-white'
                    : pct === 100 ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-[#0B3D91] hover:text-white'
                )}
                title={mod.title}
              >
                {idx + 1}
              </button>
            )
          })}
        </div>
      )}
    </aside>
  )
}
