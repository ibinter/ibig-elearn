import Link from 'next/link'
import type { Metadata } from 'next'
import { Clock, HeartHandshake, Video, Phone, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import CourseLanguageBadge from '@/components/ui/CourseLanguageBadge'

export const metadata: Metadata = {
  title: 'Coaching individuel',
  description: 'Réservez une séance de coaching individuel en visio avec un coach partenaire IBIG EDUFORM : carrière, entrepreneuriat, leadership, prise de parole. Paiement Mobile Money.',
  alternates: { canonical: '/coaching' },
}

type OfferRow = {
  id: string; title: string; description: string; category: string | null; duration_min: number; price_xof: number; language: string; format: string
  coach: { id: string; full_name: string; avatar_url: string | null; professional_title: string | null } | null
}

export default async function CoachingPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('coaching_offers')
    .select('id, title, description, category, duration_min, price_xof, language, format, coach:profiles(id, full_name, avatar_url, professional_title)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  const offers = ((data ?? []) as unknown as OfferRow[]).filter(o => o.coach)

  return (
    <div className="bg-gray-50 min-h-screen">
      <section className="hero-photo bg-coaching text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <p className="text-xs font-bold uppercase tracking-widest text-[#FFA500]">Coaching individuel</p>
          <h1 className="mt-2 text-[26px] sm:text-4xl font-extrabold leading-tight">Progressez plus vite avec un coach</h1>
          <p className="mt-3 text-blue-100 text-[15px] sm:text-lg max-w-2xl leading-relaxed">
            Des séances en visio avec des coachs et experts partenaires d&apos;IBIG EDUFORM. Choisissez votre créneau, payez en Mobile Money, recevez votre lien de visio.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {offers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <HeartHandshake className="w-12 h-12 text-[#0B3D91]/40 mx-auto" />
            <h2 className="mt-3 text-lg font-bold text-gray-900">Les premiers coachs arrivent bientôt</h2>
            <p className="mt-1 text-gray-500 text-sm">Vous êtes coach ? Rejoignez le programme partenaire IBIG EDUFORM pour proposer vos séances.</p>
            <Link href="/inscription?profil=coach" className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-xl ibig-gradient text-white font-semibold">
              Devenir coach partenaire <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map(o => (
              <Link key={o.id} href={`/coaching/${o.id}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full ibig-gradient flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                    {o.coach?.avatar_url ? <img src={o.coach.avatar_url} alt="" className="w-full h-full object-cover" /> : o.coach?.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate" data-no-translate>{o.coach?.full_name}</p>
                    {o.coach?.professional_title && <p className="text-xs text-gray-500 truncate">{o.coach.professional_title}</p>}
                  </div>
                </div>
                <h2 className="mt-4 font-bold text-gray-900 leading-snug group-hover:text-[#0B3D91] line-clamp-2">{o.title}</h2>
                <p className="mt-1.5 text-sm text-gray-500 line-clamp-3 flex-1">{o.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {o.duration_min} min</span>
                  <span className="inline-flex items-center gap-1">{o.format === 'phone' ? <Phone className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />} {o.format === 'phone' ? 'Téléphone' : 'Visio'}</span>
                  <CourseLanguageBadge language={o.language} />
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-lg font-extrabold text-[#0B3D91]">{o.price_xof > 0 ? `${o.price_xof.toLocaleString('fr-FR')} FCFA` : 'Gratuit'}</p>
                  <span className="text-sm font-semibold text-[#0B3D91] inline-flex items-center gap-1">Réserver <ArrowRight className="w-4 h-4" /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
