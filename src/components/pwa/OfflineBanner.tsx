'use client'

import { useEffect, useState } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)
  const [showBack, setShowBack] = useState(false)

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => {
      setOffline(false)
      setShowBack(true)
      setTimeout(() => setShowBack(false), 3000)
    }

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)

    // Vérifier l'état initial
    if (!navigator.onLine) setOffline(true)

    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (showBack) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg animate-bounce">
        <Wifi className="w-4 h-4" />
        Connexion rétablie
      </div>
    )
  }

  if (!offline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-sm font-semibold px-4 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] flex items-center justify-center gap-2">
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      Mode hors ligne — certaines fonctionnalités sont limitées
    </div>
  )
}
