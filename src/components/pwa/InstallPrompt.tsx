'use client'

import { useEffect, useState } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Déjà installée ?
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem('pwa-prompt-dismissed')) return

    const isIOSDevice = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream
    if (isIOSDevice) {
      setIsIOS(true)
      // Sur iOS, montrer après 30s (pas d'événement beforeinstallprompt)
      const t = setTimeout(() => setShow(true), 30_000)
      return () => clearTimeout(t)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    setShow(false)
    localStorage.setItem('pwa-prompt-dismissed', '1')
  }

  const install = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  if (!show) return null

  if (showIOSInstructions) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#0B3D91]" />
            <span className="font-bold text-gray-900 text-sm">Installer sur iPhone/iPad</span>
          </div>
          <button onClick={dismiss} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <ol className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start gap-2"><span className="font-bold text-[#0B3D91] flex-shrink-0">1.</span> Appuyez sur le bouton <strong>Partager</strong> en bas de Safari</li>
          <li className="flex items-start gap-2"><span className="font-bold text-[#0B3D91] flex-shrink-0">2.</span> Faites défiler et appuyez sur <strong>Sur l'écran d'accueil</strong></li>
          <li className="flex items-start gap-2"><span className="font-bold text-[#0B3D91] flex-shrink-0">3.</span> Appuyez sur <strong>Ajouter</strong></li>
        </ol>
        <button onClick={dismiss} className="mt-4 w-full bg-gray-100 text-gray-700 font-semibold text-sm py-2.5 rounded-xl hover:bg-gray-200 transition-colors">
          Compris !
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-[#0B3D91] to-[#1a5cbf] p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm">Installer l'application</p>
          <p className="text-blue-200 text-xs">Accès rapide, même hors ligne</p>
        </div>
        <button onClick={dismiss} className="text-white/60 hover:text-white flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-4">Installez IBIG E-LEARN sur votre écran d'accueil pour accéder à vos formations sans connexion.</p>
        <div className="flex gap-3">
          <button onClick={dismiss} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            Plus tard
          </button>
          <button onClick={install} className="flex-1 py-2.5 bg-[#0B3D91] text-white rounded-xl text-sm font-semibold hover:bg-[#0a3480] transition-colors">
            Installer
          </button>
        </div>
      </div>
    </div>
  )
}
