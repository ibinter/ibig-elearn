'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Award, Share2, X, ExternalLink } from 'lucide-react'

interface Props {
  courseTitle: string
  certificateId?: string
  courseId: string
  onClose: () => void
}

export default function CompletionCelebration({ courseTitle, certificateId, courseId, onClose }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
  }, [])

  const close = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  const shareLinkedIn = () => {
    const url = certificateId ? `https://ibig-elearn.vercel.app/mes-certificats/${certificateId}/imprimer` : 'https://ibig-elearn.vercel.app'
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
  }

  const shareWhatsApp = () => {
    const msg = `🎓 Je viens de terminer la formation "${courseTitle}" sur IBIG E-LEARN et j'ai obtenu mon certificat ! 🏆`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${visible ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'}`}
      onClick={close}
    >
      {/* Confetti CSS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-sm animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}px`,
              backgroundColor: ['#FFA500', '#0B3D91', '#FFD700', '#00C851', '#FF4444', '#AA00FF'][i % 6],
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>

      <div
        className={`bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center relative transition-all duration-300 ${visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-4'}`}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={close} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Trophée animé */}
        <div className="w-20 h-20 ibig-gradient rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-once shadow-lg">
          <Award className="w-10 h-10 text-white" />
        </div>

        <div className="inline-block bg-[#FFA500]/10 text-[#FFA500] text-xs font-bold px-3 py-1 rounded-full mb-3">
          🎉 FÉLICITATIONS !
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Formation terminée !</h2>
        <p className="text-gray-500 text-sm mb-1">Vous avez complété avec succès</p>
        <p className="font-bold text-[#0B3D91] mb-6 text-base leading-snug">{courseTitle}</p>

        {certificateId && (
          <div className="bg-gradient-to-r from-[#0B3D91]/5 to-[#FFA500]/5 border border-[#0B3D91]/20 rounded-2xl p-4 mb-6">
            <p className="text-xs text-gray-500 mb-2">🏆 Votre certificat a été émis automatiquement</p>
            <Link
              href={`/mes-certificats/${certificateId}/imprimer`}
              onClick={close}
              className="flex items-center justify-center gap-2 text-sm font-semibold text-[#0B3D91] hover:text-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Voir et télécharger mon certificat
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button onClick={shareLinkedIn}
            className="flex items-center justify-center gap-2 bg-[#0A66C2] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#004182] transition-colors">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            LinkedIn
          </button>
          <button onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2 bg-[#25D366] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#128C7E] transition-colors">
            <Share2 className="w-4 h-4" /> WhatsApp
          </button>
        </div>

        <button onClick={close}
          className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-2">
          Continuer l&apos;apprentissage
        </button>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti { animation: confetti-fall linear infinite; }
        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          30% { transform: scale(1.3); }
          60% { transform: scale(0.9); }
          80% { transform: scale(1.1); }
        }
        .animate-bounce-once { animation: bounce-once 0.8s ease-out; }
      `}</style>
    </div>
  )
}
