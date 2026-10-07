'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/i18n/client'
import { Eye, EyeOff, Loader2, UserPlus, GraduationCap, Presentation, Building2, HeartHandshake } from 'lucide-react'

const COUNTRIES = [
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'SN', name: 'Sénégal' },
  { code: 'ML', name: 'Mali' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'BJ', name: 'Bénin' },
  { code: 'TG', name: 'Togo' },
  { code: 'GN', name: 'Guinée' },
  { code: 'CM', name: 'Cameroun' },
  { code: 'GA', name: 'Gabon' },
  { code: 'CG', name: 'Congo-Brazzaville' },
  { code: 'TD', name: 'Tchad' },
  { code: 'CD', name: 'RDC' },
  { code: 'MA', name: 'Maroc' },
  { code: 'FR', name: 'France' },
  { code: 'CA', name: 'Canada' },
  { code: 'OTHER', name: 'Autre' },
]

type AccountType = 'apprenant' | 'formateur' | 'coach' | 'entreprise'

const PROFILES: { key: AccountType; label: string; desc: string; icon: typeof GraduationCap; next: string; note: string }[] = [
  { key: 'apprenant', label: 'Apprenant', desc: 'Je veux me former', icon: GraduationCap, next: '/tableau-de-bord',
    note: 'Accédez au catalogue, suivez vos formations et obtenez des certificats vérifiables.' },
  { key: 'formateur', label: 'Formateur', desc: 'Je veux enseigner', icon: Presentation, next: '/devenir-partenaire',
    note: 'Programme Formateurs Partenaires IBIG EDUFORM : créez votre compte, confirmez votre email, puis déposez votre candidature pour publier vos formations.' },
  { key: 'coach', label: 'Coach', desc: "J'accompagne", icon: HeartHandshake, next: '/devenir-partenaire',
    note: "Coachs professionnels : rejoignez le programme partenaire IBIG EDUFORM pour proposer vos programmes d'accompagnement et vos sessions live, avec partage des revenus." },
  { key: 'entreprise', label: 'Entreprise', desc: 'Former mes équipes', icon: Building2, next: '/entreprise#contact',
    note: 'Entreprises, ONG et institutions : créez votre compte, puis décrivez votre besoin pour recevoir une offre sur mesure pour vos équipes.' },
]

export default function InscriptionPage() {
  return <Suspense><InscriptionForm /></Suspense>
}

function InscriptionForm() {
  const { t } = useLocale()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', country: 'CI', phone: '', company_name: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [refCode, setRefCode] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  // Retour après inscription (ex. parcours formateur partenaire) — chemins internes uniquement
  const initialProfile = searchParams.get('profil')
  const [accountType, setAccountType] = useState<AccountType>(
    initialProfile === 'formateur' || initialProfile === 'coach' || initialProfile === 'entreprise' ? initialProfile : 'apprenant')
  const profile = PROFILES.find(p => p.key === accountType)!
  // Retour après inscription : chemin interne explicite, sinon selon le profil choisi
  const rawNext = searchParams.get('next') ?? ''
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : profile.next

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) setRefCode(ref)
    // Invitation entreprise : adresse pré-remplie
    const email = searchParams.get('email')
    if (email) setForm(f => (f.email ? f : { ...f, email }))
  }, [searchParams])

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    if (form.password.length < 8) {
      setError(t.auth.passwordMin8)
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name, country: form.country, phone: form.phone, referral_code: refCode || undefined, account_type: accountType, company_name: accountType === 'entreprise' ? form.company_name || undefined : undefined },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })

    if (error) {
      setError(error.message === 'User already registered' ? t.auth.emailExists : error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.auth.accountCreated}</h2>
          <p className="text-gray-500 mb-6">{t.auth.confirmEmailMsg} <strong>{form.email}</strong>. {t.auth.confirmEmailAction}</p>
          <Link href={`/connexion?redirectTo=${encodeURIComponent(next)}`} className="inline-block ibig-gradient text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
            {t.auth.goToLogin}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.auth.registerTitle}</h1>
          <p className="text-gray-500 text-sm">{t.auth.registerSubtitle}</p>
        </div>

        {/* Type de compte */}
        <fieldset className="mb-6">
          <legend className="block text-sm font-semibold text-gray-800 mb-2">Je m&apos;inscris en tant que</legend>
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            {PROFILES.map(p => {
              const on = accountType === p.key
              return (
                <button key={p.key} type="button" role="radio" aria-checked={on} onClick={() => setAccountType(p.key)}
                  className={`flex flex-col items-center text-center gap-1 rounded-xl border-2 px-1.5 py-3 transition-colors ${on ? 'border-[#0B3D91] bg-[#0B3D91]/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <p.icon className={`w-6 h-6 ${on ? 'text-[#0B3D91]' : 'text-gray-400'}`} />
                  <span className={`text-sm font-bold ${on ? 'text-[#0B3D91]' : 'text-gray-800'}`}>{p.label}</span>
                  <span className="text-[11px] leading-tight text-gray-500">{p.desc}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">{profile.note}</p>
        </fieldset>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 mb-4"
        >
          {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {googleLoading ? t.auth.redirecting : t.auth.signupWithGoogle}
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">ou</span></div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.auth.fullName}</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              required
              placeholder={t.auth.fullNamePlaceholder}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm"
            />
          </div>
          {accountType === 'entreprise' && (
            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1.5">Nom de l&apos;entreprise / organisation</label>
              <input
                id="company_name"
                type="text"
                value={form.company_name}
                onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                required
                autoComplete="organization"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.auth.email}</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              placeholder={t.auth.emailPlaceholder}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.auth.country}</label>
              <select
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm bg-white"
              >
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.auth.phone}</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+225 XX XX XX XX"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.auth.password}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                placeholder={t.auth.passwordPlaceholder}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm pr-12"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            {t.auth.termsAccept}{' '}
            <Link href="/cgu" className="text-[#0B3D91] hover:underline">{t.auth.termsLink}</Link> {t.auth.andThe}{' '}
            <Link href="/confidentialite" className="text-[#0B3D91] hover:underline">{t.auth.privacyLink}</Link>.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 ibig-gradient text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
            {loading ? t.auth.creating : t.auth.registerBtn}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t.auth.hasAccount}{' '}
          <Link href={`/connexion?redirectTo=${encodeURIComponent(next)}`} className="text-[#0B3D91] font-semibold hover:underline">{t.auth.loginLink}</Link>
        </p>
      </div>
    </div>
  )
}
