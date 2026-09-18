'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

// Capture ?ref=CODE dans un cookie 30 jours
export default function RefCapture() {
  const params = useSearchParams()

  useEffect(() => {
    const ref = params.get('ref')
    if (ref && /^[A-Z0-9-]{4,30}$/i.test(ref)) {
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()
      document.cookie = `ibig_ref=${encodeURIComponent(ref.toUpperCase())}; expires=${expires}; path=/; SameSite=Lax`
    }
  }, [params])

  return null
}
