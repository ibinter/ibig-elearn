'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, MessageSquare, Send, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { useLocale } from '@/i18n/client'

const SUBJECTS = [
  'Question sur une formation',
  'Problème technique',
  'Paiement et facturation',
  'Devenir formateur',
  'Partenariat entreprise',
  'Autre',
]

export default function ContactPage() {
  const { t } = useLocale()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      setSent(true)
    } catch {
      setError(t.contact.errorFallback)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Header */}
      <div className="text-center mb-12 hero-photo bg-support rounded-3xl text-white px-6 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">{t.contact.title}</h1>
        <p className="text-blue-100 max-w-xl mx-auto">{t.contact.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Infos contact */}
        <div className="space-y-6">
          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-sm">
            <picture>
              <source media="(max-width: 767px)" srcSet="/images/bg/team-m.webp" />
              <img src="/images/bg/team.webp" alt="L&apos;équipe IBIG à votre écoute" loading="lazy" className="w-full h-full object-cover" />
            </picture>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 text-white">
              <p className="font-bold">Une équipe à votre écoute</p>
              <p className="text-sm text-white/80">Apprenants, formateurs et entreprises : réponse sous 24 h ouvrées.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-5">{t.contact.coordinatesTitle}</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0B3D91]/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-[#0B3D91]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">{t.contact.emailLabel}</p>
                  <a href="mailto:contact@ibig-elearning.com" className="text-sm text-[#0B3D91] hover:underline font-medium">
                    contact@ibig-elearning.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0B3D91]/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-[#0B3D91]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">{t.contact.phoneLabel}</p>
                  <a href="tel:+22507000000" className="text-sm text-[#0B3D91] hover:underline font-medium">
                    +225 07 00 00 00 00
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0B3D91]/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-[#0B3D91]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">{t.contact.addressLabel}</p>
                  <p className="text-sm text-gray-700">Abidjan, Côte d'Ivoire<br />IBIG SARL — Pôle EDUFORM</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-3">{t.contact.hoursTitle}</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>{t.contact.mondayFriday}</span>
                <span className="font-medium text-gray-900">8h – 18h (GMT)</span>
              </div>
              <div className="flex justify-between">
                <span>{t.contact.saturday}</span>
                <span className="font-medium text-gray-900">9h – 13h (GMT)</span>
              </div>
              <div className="flex justify-between">
                <span>{t.contact.sunday}</span>
                <span className="text-gray-400">{t.contact.closed}</span>
              </div>
            </div>
          </div>

          <div className="ibig-gradient rounded-2xl p-6 text-white">
            <MessageSquare className="w-7 h-7 text-[#FFA500] mb-3" />
            <h3 className="font-bold mb-1">{t.contact.instructorCta}</h3>
            <p className="text-blue-200 text-sm leading-relaxed">
              {t.contact.instructorCtaSub}
            </p>
            <a href="mailto:formateurs@ibig-elearning.com" className="mt-3 inline-block text-sm font-semibold text-[#FFA500] hover:text-orange-300 transition-colors">
              formateurs@ibig-elearning.com →
            </a>
          </div>
        </div>

        {/* Formulaire */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            {sent ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t.contact.success}</h3>
                <p className="text-gray-500 mb-6">{t.contact.successText}</p>
                <button
                  onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                  className="text-[#0B3D91] font-semibold hover:underline text-sm"
                >
                  {t.contact.sendAnother}
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-bold text-gray-900 text-lg mb-6">{t.contact.sendMessage}</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.contact.name} *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        required
                        placeholder={t.contact.namePlaceholder}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.contact.emailField} *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        required
                        placeholder="vous@exemple.com"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.contact.subject} *</label>
                    <select aria-label={t.contact.subject}
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm bg-white"
                    >
                      <option value="">{t.contact.subjectPlaceholder}</option>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.contact.message} *</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      required
                      rows={6}
                      placeholder={t.contact.messagePlaceholder}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm resize-none"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 ibig-gradient text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {loading ? t.contact.sending : t.contact.send}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
