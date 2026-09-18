'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, BookOpen, User, FileText, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  type: 'course' | 'instructor' | 'blog'
  title: string
  subtitle?: string
  href: string
  image?: string
}

export default function GlobalSearch({ className = '' }: { className?: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (query.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.results ?? [])
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/catalogue?q=${encodeURIComponent(query.trim())}`)
      setOpen(false)
    }
  }

  const icons = { course: BookOpen, instructor: User, blog: FileText }
  const typeLabels = { course: 'Formation', instructor: 'Formateur', blog: 'Article' }
  const typeColors = { course: 'text-blue-600 bg-blue-50', instructor: 'text-purple-600 bg-purple-50', blog: 'text-green-600 bg-green-50' }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Rechercher formations, formateurs..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0B3D91] focus:ring-1 focus:ring-[#0B3D91]/20 transition-all"
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
          {!loading && query && (
            <button type="button" onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
          {results.map(r => {
            const Icon = icons[r.type]
            return (
              <Link key={r.id} href={r.href} onClick={() => { setOpen(false); setQuery('') }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[r.type]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                  {r.subtitle && <p className="text-xs text-gray-500 truncate">{r.subtitle}</p>}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${typeColors[r.type]}`}>
                  {typeLabels[r.type]}
                </span>
              </Link>
            )
          })}
          {query.length >= 2 && (
            <Link href={`/catalogue?q=${encodeURIComponent(query)}`} onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-3 bg-[#0B3D91]/5 text-[#0B3D91] text-sm font-medium hover:bg-[#0B3D91]/10 transition-colors">
              <Search className="w-4 h-4" />
              Voir tous les résultats pour &ldquo;{query}&rdquo;
            </Link>
          )}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 px-4 py-5 text-center text-sm text-gray-500">
          Aucun résultat pour &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  )
}
