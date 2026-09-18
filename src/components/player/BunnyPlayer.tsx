'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle } from 'lucide-react'

interface Props {
  videoGuid: string
  libraryId: string
  lessonId: string
  courseId: string
  userId: string
  lastPosition: number
  isCompleted: boolean
  videoDurationSeconds?: number
}

export default function BunnyPlayer({
  videoGuid,
  libraryId,
  lessonId,
  courseId,
  userId,
  lastPosition,
  isCompleted: initialCompleted,
  videoDurationSeconds,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [watchedSeconds, setWatchedSeconds] = useState(lastPosition)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const supabase = createClient()

  const embedUrl =
    `https://iframe.mediadelivery.net/embed/${libraryId}/${videoGuid}` +
    `?autoplay=false&loop=false&muted=false&preload=true&responsive=true` +
    (lastPosition > 5 ? `&start=${Math.floor(lastPosition)}` : '')

  const saveProgress = useCallback(async (seconds: number, completed: boolean) => {
    await supabase.from('lesson_progress').upsert({
      user_id: userId,
      lesson_id: lessonId,
      course_id: courseId,
      is_completed: completed,
      last_position_seconds: Math.floor(seconds),
      watch_time_seconds: Math.floor(seconds),
      completed_at: completed ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' })
  }, [userId, lessonId, courseId, supabase])

  useEffect(() => {
    // Bunny Stream player sends postMessage events
    function handleMessage(e: MessageEvent) {
      if (typeof e.data !== 'object' || e.data?.source !== 'bunny-stream-player') return
      const { event, data } = e.data as { event: string; data?: { currentTime?: number; duration?: number } }

      if (event === 'timeupdate' && data?.currentTime != null) {
        const current = data.currentTime
        const duration = data.duration ?? videoDurationSeconds ?? 0
        setWatchedSeconds(current)

        if (duration > 0 && current / duration >= 0.9 && !isCompleted) {
          setIsCompleted(true)
          saveProgress(current, true)
        }
      }
      if (event === 'ended') {
        setIsCompleted(true)
        saveProgress(videoDurationSeconds ?? watchedSeconds, true)
      }
    }

    window.addEventListener('message', handleMessage)

    // Sauvegarde périodique toutes les 30s même sans events (fallback)
    intervalRef.current = setInterval(() => {
      setWatchedSeconds(prev => {
        saveProgress(prev, isCompleted)
        return prev
      })
    }, 30000)

    return () => {
      window.removeEventListener('message', handleMessage)
      clearInterval(intervalRef.current)
    }
  }, [isCompleted, videoDurationSeconds, watchedSeconds, saveProgress])

  const pct = videoDurationSeconds && watchedSeconds
    ? Math.min(100, (watchedSeconds / videoDurationSeconds) * 100)
    : 0

  return (
    <div className="bg-black relative">
      <div className="relative aspect-video w-full">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
        {isCompleted && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-green-500/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
            <CheckCircle className="w-3.5 h-3.5" /> Leçon terminée
          </div>
        )}
        {pct > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 pointer-events-none">
            <div className="h-full bg-[#FFA500] transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}
