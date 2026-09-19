'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function DarkModeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem('theme')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const isDark = stored ? stored === 'dark' : prefersDark
      setDark(isDark)
      document.documentElement.classList.toggle('dark', isDark)
    } catch {}
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', next)
    } catch {}
  }

  if (!mounted) return <div className="w-9 h-9" />

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Mode clair' : 'Mode sombre'}
      className={`w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
    >
      {dark
        ? <Sun className="w-5 h-5 text-[#FFA500]" />
        : <Moon className="w-5 h-5 text-gray-500" />}
    </button>
  )
}
