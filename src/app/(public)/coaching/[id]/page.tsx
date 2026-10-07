import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, Clock, Phone, ShieldCheck, Video } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import CourseLanguageBadge from '@/components/ui/CourseLanguageBadge'
import SlotPicker from './SlotPicker'

type Props = { params: Promise<{ id: string }> }

async function load(id: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('coaching_offers')
    .select('id, title, description, category, duration_min, price_xof, language, format, is_active, coach:profiles(id, full_name, avatar_url, professional_title, bio)')
    .eq('id', id).single()
  return data as unknown as null | {
    id: string; title: string; description: string; category: string | null; duration_min: number; price_xof: number; language: string; format: string; is_active: boolean
    coach: { id: string; full_name: string; avatar_url: string | null; professional_title: string | null; bio: string | null } | null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const o = await load(id)
  if (!o) return { title: 'Coaching introuvable' }
  return { title: `${o.title} — coaching avec ${o.coach?.full_name ?? 'un coach'}`, description: o.description.slice(0, 155), alternates: { canonical: `/coaching/${o.id}` } }
}

export default async function CoachingOfferPage({ params }: Props) {
  const { id } = await params
  const o = await load(id)
  if (!o || !o.is_active || !o.coach) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-10 space-y-5">
        <Link href="/coaching" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#0B3D91]">
          <ArrowLeft className="w-4 h-4" /> Coaching
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full ibig-gradient flex items-center justify-center text-white text-xl font-bold overflow-hidden flex-shrink-0">
              {o.coach.avatar_url ? <img src={o.coach.avatar_url} alt="" className="w-full h-full object-cover" /> : o.coach.full_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900" data-no-translate>{o.coach.full_name}</p>
              {o.coach.professional_title && <p className="text-sm text-gray-500">{o.coach.professional_title}</p>}
            </div>
          </div>
          <h1 className="mt-5 text-[24px] sm:text-3xl font-extrabold text-[#0B1E4B] leading-tight">{o.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4" /> {o.duration_min} min</span>
            <span className="inline-flex items-center gap-1.5">{o.format === 'phone' ? <Phone className="w-4 h-4" /> : <Video className="w-4 h-4" />} {o.format === 'phone' ? 'Par téléphone' : 'En visio'}</span>
            <CourseLanguageBadge language={o.language} />
          </div>
          <p className="mt-4 text-[15px] text-gray-700 leading-relaxed whitespace-pre-line">{o.description}</p>
          {o.coach.bio && (
            <details className="mt-4 rounded-xl bg-gray-50 border border-gray-100">
              <summary className="px-4 py-3 text-sm font-semibold text-gray-700 cursor-pointer">À propos du coach</summary>
              <p className="px-4 pb-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line">{o.coach.bio}</p>
            </details>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">Choisissez votre créneau</h2>
            <p className="text-xl font-extrabold text-[#0B3D91]">{o.price_xof > 0 ? `${o.price_xof.toLocaleString('fr-FR')} FCFA` : 'Gratuit'}</p>
          </div>
          <SlotPicker offerId={o.id} isLoggedIn={!!user} isOwn={user?.id === o.coach.id} priceXof={o.price_xof} />
        </div>

        <p className="flex items-start gap-2 text-xs text-gray-500 px-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          Paiement sécurisé Mobile Money ou carte. Annulation gratuite jusqu&apos;à 24 h avant la séance. Lien de visio envoyé après confirmation.
        </p>
      </div>
    </div>
  )
}
