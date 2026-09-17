'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, MessageSquare, Send, CheckCircle, Loader2 } from 'lucide-react'

const SUBJECTS = [
  'Question sur une formation',
  'Problème technique',
  'Paiement et facturation',
  'Devenir formateur',
  'Partenariat entreprise',
  'Autre',
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Contactez-nous</h1>
        <p className="text-gray-500 max-w-xl mx-auto">Notre équipe est disponible pour répondre à toutes vos questions. Nous vous répondons sous 24h ouvrées.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Infos contact */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-5">Nos coordonnées</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0B3D91]/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-[#0B3D91]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Email</p>
                  <a href="mailto:contact@ibiglearn.com" className="text-sm text-[#0B3D91] hover:underline font-medium">
                    contact@ibiglearn.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0B3D91]/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-[#0B3D91]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Téléphone / WhatsApp</p>
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
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Adresse</p>
                  <p className="text-sm text-gray-700">Abidjan, Côte d'Ivoire<br />IBIG SARL — Pôle EDUFORM</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-3">Horaires d'assistance</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Lundi – Vendredi</span>
                <span className="font-medium text-gray-900">8h – 18h (GMT)</span>
              </div>
              <div className="flex justify-between">
                <span>Samedi</span>
                <span className="font-medium text-gray-900">9h – 13h (GMT)</span>
              </div>
              <div className="flex justify-between">
                <span>Dimanche</span>
                <span className="text-gray-400">Fermé</span>
              </div>
            </div>
          </div>

          <div className="ibig-gradient rounded-2xl p-6 text-white">
            <MessageSquare className="w-7 h-7 text-[#FFA500] mb-3" />
            <h3 className="font-bold mb-1">Vous êtes formateur ?</h3>
            <p className="text-blue-200 text-sm leading-relaxed">
              Rejoignez notre réseau de formateurs et partagez vos expertises avec des milliers d'apprenants africains.
            </p>
            <a href="mailto:formateurs@ibiglearn.com" className="mt-3 inline-block text-sm font-semibold text-[#FFA500] hover:text-orange-300 transition-colors">
              formateurs@ibiglearn.com →
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">Message envoyé !</h3>
                <p className="text-gray-500 mb-6">Merci pour votre message. Notre équipe vous répondra dans les 24 heures ouvrées.</p>
                <button
                  onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                  className="text-[#0B3D91] font-semibold hover:underline text-sm"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-bold text-gray-900 text-lg mb-6">Envoyer un message</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        required
                        placeholder="Votre nom"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email *</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Sujet *</label>
                    <select
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm bg-white"
                    >
                      <option value="">Sélectionner un sujet...</option>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      required
                      rows={6}
                      placeholder="Décrivez votre demande en détail..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 ibig-gradient text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {loading ? 'Envoi en cours...' : 'Envoyer le message'}
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
