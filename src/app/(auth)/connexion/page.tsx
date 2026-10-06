'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/i18n/client'
import { Eye, EyeOff, Loader2, LogIn, Shield } from 'lucide-react'

interface SSOProvider {
  id: string
  provider_type: string
  button_label: string
  button_logo_url: string | null
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function ConnexionPage() {
  const { t } = useLocale()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [ssoLoading, setSsoLoading] = useState(false)
  const [error, setError] = useState('')
  const [ssoProvider, setSsoProvider] = useState<SSOProvider | null>(null)
  const [detectingSSO, setDetectingSSO] = useState(false)
  const router = useRouter()
  const lastChecked = useRef('')

  const debouncedEmail = useDebounce(email, 600)

  // Détection SSO automatique selon le domaine email
  useEffect(() => {
    const domain = debouncedEmail.includes('@') ? debouncedEmail.split('@')[1] : ''
    if (!domain || domain === lastChecked.current) return
    lastChecked.current = domain
    setDetectingSSO(true)
    fetch('/api/sso/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: debouncedEmail }),
    })
      .then(r => r.json())
      .then(d => setSsoProvider(d.provider ?? null))
      .finally(() => setDetectingSSO(false))
  }, [debouncedEmail])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(t.auth.incorrectCredentials)
      setLoading(false)
      return
    }
    const params = new URLSearchParams(window.location.search)
    router.push(params.get('redirectTo') ?? '/tableau-de-bord')
    router.refresh()
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const supabase = createClient()
    const params = new URLSearchParams(window.location.search)
    const next = params.get('redirectTo') ?? '/tableau-de-bord'
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}` },
    })
  }

  const handleSSO = async () => {
    if (!ssoProvider) return
    setSsoLoading(true)
    try {
      const params = new URLSearchParams(window.location.search)
      const next = params.get('redirectTo') ?? '/tableau-de-bord'
      const res = await fetch('/api/sso/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_id: ssoProvider.id, redirect_to: next }),
      })
      const data = await res.json()

      if (data.oauth_provider) {
        const supabase = createClient()
        await supabase.auth.signInWithOAuth({
          provider: data.oauth_provider,
          options: { redirectTo: data.callback_url },
        })
      } else if (data.redirect_url) {
        window.location.href = data.redirect_url
      } else {
        setError(data.error ?? 'Erreur SSO')
      }
    } finally {
      setSsoLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.auth.loginTitle}</h1>
          <p className="text-gray-500 text-sm">{t.auth.loginSubtitle}</p>
        </div>

        {/* Google OAuth */}
        <button type="button" onClick={handleGoogle} disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 mb-3">
          {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {googleLoading ? t.auth.redirecting : t.auth.continueWithGoogle}
        </button>

        {/* Bouton SSO — apparaît dynamiquement */}
        {ssoProvider && (
          <button type="button" onClick={handleSSO} disabled={ssoLoading}
            className="w-full flex items-center justify-center gap-3 border-2 border-[#0B3D91]/40 bg-[#0B3D91]/5 rounded-xl py-3 px-4 text-sm font-semibold text-[#0B3D91] hover:bg-[#0B3D91]/10 transition-colors disabled:opacity-60 mb-3 animate-in fade-in duration-300">
            {ssoLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              ssoProvider.button_logo_url
                ? <img src={ssoProvider.button_logo_url} alt="" className="w-5 h-5 object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
                : <Shield className="w-5 h-5" />
            )}
            {ssoLoading ? t.auth.connectingSSO : ssoProvider.button_label}
          </button>
        )}

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">{t.auth.orWithEmail}</span></div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.auth.email}</label>
            <div className="relative">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder={t.auth.emailPlaceholder}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent text-sm" />
              {detectingSSO && (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>
            {ssoProvider && (
              <p className="text-xs text-[#0B3D91] mt-1.5 flex items-center gap-1">
                <Shield className="w-3 h-3" /> {t.auth.ssoAvailable}
              </p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">{t.auth.password}</label>
              <Link href="/mot-de-passe-oublie" className="text-xs text-[#0B3D91] hover:underline">{t.auth.forgotPassword}</Link>
            </div>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent text-sm pr-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 ibig-gradient text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            {loading ? t.auth.connecting : t.auth.loginBtn}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t.auth.noAccount}{' '}
          <Link href="/inscription" className="text-[#0B3D91] font-semibold hover:underline">{t.auth.registerLink}</Link>
        </p>
      </div>
    </div>
  )
}
