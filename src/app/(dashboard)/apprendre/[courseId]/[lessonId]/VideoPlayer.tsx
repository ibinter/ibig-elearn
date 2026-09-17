'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle } from 'lucide-react'

interface Props {
  videoUrl: string
  lessonId: string
  courseId: string
  userId: string
  lastPosition: number
  isCompleted: boolean
}

export default function VideoPlayer({ videoUrl, lessonId, courseId, userId, lastPosition, isCompleted: initialCompleted }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [progress, setProgress] = useState(0)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const supabase = createClient()

  const saveProgress = useCallback(async (currentTime: number, completed: boolean) => { // eslint-disable-line
    await supabase.from('lesson_progress').upsert({
      user_id: userId,
      lesson_id: lessonId,
      course_id: courseId,
      is_completed: completed,
      last_position_seconds: Math.floor(currentTime),
      watch_time_seconds: Math.floor(currentTime),
      completed_at: completed ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' })
  }, [userId, lessonId, courseId, supabase])

  useEffect(() => {
    if (videoRef.current && lastPosition > 0) {
      videoRef.current.currentTime = lastPosition
    }
  }, [lastPosition])

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    const pct = (video.currentTime / video.duration) * 100
    setProgress(pct)

    // Auto-complétion à 90%
    if (pct >= 90 && !isCompleted) {
      setIsCompleted(true)
      saveProgress(video.currentTime, true)
    }

    // Sauvegarde toutes les 15s
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveProgress(video.currentTime, isCompleted || pct >= 90)
    }, 15000)
  }

  const handleEnded = () => {
    setIsCompleted(true)
    saveProgress(videoRef.current?.duration ?? 0, true)
  }

  return (
    <div className="bg-black relative">
      {/* Détecter si c'est une URL HLS (Bunny Stream) ou directe */}
      {videoUrl.includes('iframe') ? (
        <div className="aspect-video w-full" dangerouslySetInnerHTML={{ __html: videoUrl }} />
      ) : (
        <div className="relative aspect-video">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            playsInline
          />
          {isCompleted && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-green-500/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
              <CheckCircle className="w-3.5 h-3.5" /> Leçon terminée
            </div>
          )}
          {/* Barre de progression */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
            <div className="h-full bg-[#FFA500] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}
