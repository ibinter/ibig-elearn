'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, RotateCcw } from 'lucide-react'

interface Props {
  audioUrl: string
  title: string
  coverUrl?: string | null
  transcriptText?: string | null
  onProgress?: (percent: number) => void
  onComplete?: () => void
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function AudioPlayer({ audioUrl, title, coverUrl, transcriptText, onProgress, onComplete }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [showTranscript, setShowTranscript] = useState(false)
  const [completed, setCompleted] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.playbackRate = speed
  }, [speed])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = muted ? 0 : volume
  }, [volume, muted])

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    setCurrentTime(audio.currentTime)
    const pct = (audio.currentTime / audio.duration) * 100
    onProgress?.(pct)
    if (pct >= 90 && !completed) {
      setCompleted(true)
      onComplete?.()
    }
  }, [completed, onComplete, onProgress])

  const handleEnded = useCallback(() => {
    setPlaying(false)
    if (!completed) {
      setCompleted(true)
      onComplete?.()
    }
  }, [completed, onComplete])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }
    setPlaying(!playing)
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    const bar = progressRef.current
    if (!audio || !bar) return
    const rect = bar.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * audio.duration
  }

  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds))
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden text-white">
      {/* Cover art */}
      <div className="relative">
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="w-full h-48 object-cover opacity-80" />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-[#0B3D91] to-[#FFA500] flex items-center justify-center">
            <span className="text-4xl sm:text-6xl">🎧</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <p className="font-bold text-base truncate">{title}</p>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <div className="p-4 space-y-4">
        {/* Barre de progression */}
        <div
          ref={progressRef}
          className="h-1.5 bg-gray-700 rounded-full cursor-pointer group"
          onClick={seek}
        >
          <div
            className="h-full bg-[#FFA500] rounded-full relative transition-all"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow" />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Contrôles */}
        <div className="flex items-center justify-center gap-6">
          <button onClick={() => skip(-10)} className="text-gray-400 hover:text-white transition-colors">
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlay}
            className="w-14 h-14 bg-[#FFA500] hover:bg-orange-500 text-black rounded-full flex items-center justify-center transition-colors shadow-lg"
          >
            {playing
              ? <Pause className="w-6 h-6" />
              : <Play className="w-6 h-6 translate-x-0.5" />
            }
          </button>

          <button onClick={() => skip(10)} className="text-gray-400 hover:text-white transition-colors">
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Volume + vitesse */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setMuted(!muted)} className="text-gray-400 hover:text-white transition-colors">
              {muted || volume === 0
                ? <VolumeX className="w-4 h-4" />
                : <Volume2 className="w-4 h-4" />
              }
            </button>
            <input
              type="range" min={0} max={1} step={0.05}
              value={muted ? 0 : volume}
              onChange={e => { setVolume(Number(e.target.value)); setMuted(false) }}
              className="w-20 h-1 accent-[#FFA500]"
            />
          </div>

          {/* Vitesse lecture */}
          <div className="flex items-center gap-1">
            {[0.75, 1, 1.25, 1.5, 2].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${
                  speed === s ? 'bg-[#FFA500] text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Transcription */}
        {transcriptText && (
          <div>
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              {showTranscript ? 'Masquer' : 'Afficher'} la transcription
            </button>
            {showTranscript && (
              <div className="mt-3 bg-gray-800 rounded-xl p-4 text-sm text-gray-300 leading-relaxed max-h-48 overflow-y-auto">
                {transcriptText}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
