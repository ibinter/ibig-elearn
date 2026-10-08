'use client'

import { useEffect, useRef } from 'react'
import { Award, Share2, X, Trophy, Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Props {
  courseTitle: string
  courseId: string
  onClose: () => void
}

export default function CourseCompletionModal({ courseTitle, courseId, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Confetti animé
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const COLORS = ['#0B3D91', '#FFA500', '#22c55e', '#a855f7', '#ef4444', '#06b6d4']
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      r: Math.random() * 8 + 3,
      d: Math.random() * 3 + 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngle: 0,
      tiltAngleIncrement: Math.random() * 0.07 + 0.05,
    }))

    let frame = 0
    let animId: number

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      particles.forEach(p => {
        ctx!.beginPath()
        ctx!.fillStyle = p.color
        ctx!.globalAlpha = 0.85
        ctx!.save()
        ctx!.translate(p.x, p.y)
        ctx!.rotate(p.tiltAngle * Math.PI / 180)
        ctx!.fillRect(-p.r / 2, -p.r, p.r, p.r * 2)
        ctx!.restore()

        p.tiltAngle += p.tiltAngleIncrement
        p.y += p.d + Math.sin(frame / 10) * 0.5
        p.x += Math.sin(p.tiltAngle) * 0.8

        if (p.y > canvas!.height) {
          p.y = -10
          p.x = Math.random() * canvas!.width
        }
      })
      frame++
      if (frame < 300) animId = requestAnimationFrame(draw)
      else ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [])

  function share() {
    const text = `🎓 Je viens de terminer "${courseTitle}" sur IBIG E-LEARNING ! #IBIG #Formation #Afrique`
    if (navigator.share) {
      navigator.share({ text, url: window.location.origin })
    } else {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Canvas confetti */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[101]" />

      {/* Modal */}
      <div className="relative z-[102] bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-[slideUp_0.4s_ease-out]">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-[#0B3D91] to-[#FFA500] p-8 text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-[bounce_1s_ease-out_3]">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Félicitations ! 🎉</h2>
          <p className="text-blue-100 text-sm">Vous avez terminé cette formation</p>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <p className="font-bold text-gray-900 text-lg leading-snug">{courseTitle}</p>
            <p className="text-gray-500 text-sm mt-1">Formation complétée à 100% ✅</p>
          </div>

          {/* XP Badge */}
          <div className="bg-gradient-to-r from-[#FFA500]/10 to-yellow-50 border border-[#FFA500]/30 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FFA500]/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-[#FFA500]" />
            </div>
            <div>
              <p className="font-bold text-gray-900">+100 XP gagnés !</p>
              <p className="text-xs text-gray-500">Progression vers le niveau suivant</p>
            </div>
          </div>

          {/* Certificat */}
          <div className="bg-gradient-to-r from-[#0B3D91]/5 to-blue-50 border border-[#0B3D91]/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#0B3D91]/10 flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-[#0B3D91]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">Certificat en cours d'émission</p>
              <p className="text-xs text-gray-500">Disponible dans quelques instants</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={share}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Share2 className="w-4 h-4" /> Partager
            </button>
            <Link
              href="/mes-certificats"
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#0B3D91] to-[#FFA500] text-white px-4 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
              onClick={onClose}
            >
              Voir mon certificat <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <Link href={`/evaluer/${courseId}`} onClick={onClose}
            className="mt-3 block text-center text-sm font-semibold text-[#0B3D91] hover:underline">
            ⭐ Donnez votre avis sur la formation (1 minute)
          </Link>

          <button onClick={onClose} className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-1">
            Continuer à apprendre
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(60px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
