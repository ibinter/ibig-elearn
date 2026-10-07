import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { CheckCircle2, Clock, FileSignature, GraduationCap, MailCheck, PauseCircle, Percent, ShieldCheck, Upload, UserPlus, Award, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPartnerState, type PartnerStage } from '@/lib/partner'
import PartnerApplicationForm from './PartnerApplicationForm'
import AgreementAcceptance from './AgreementAcceptance'

export const metadata: Metadata = {
  title: 'Devenir formateur partenaire IBIG EDUFORM',
  description: 'Publiez vos formations sur IBIG E-LEARNING et partagez les revenus avec IBIG EDUFORM : candidature, convention de partenariat, validation et certificats cosignés.',
  alternates: { canonical: '/devenir-partenaire' },
}

const STEPS: { key: PartnerStage[]; label: string; icon: typeof UserPlus }[] = [
  { key: ['account', 'confirm'], label: 'Compte', icon: UserPlus },
  { key: ['apply', 'review'], label: 'Candidature', icon: GraduationCap },
  { key: ['terms'], label: 'Convention', icon: FileSignature },
  { key: ['partner'], label: 'Formations', icon: Upload },
]

function Stepper({ stage }: { stage: PartnerStage }) {
  const current = STEPS.findIndex(s => s.key.includes(stage))
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Étapes du partenariat">
      {STEPS.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={s.label} className="flex flex-col items-center text-center gap-1.5">
            <span className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
              done ? 'bg-emerald-500 border-emerald-500 text-white' : active ? 'bg-[#0B3D91] border-[#0B3D91] text-white' : 'bg-white border-gray-200 text-gray-400'}`}>
              {done ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
            </span>
            <span className={`text-[11px] sm:text-xs font-semibold ${active ? 'text-[#0B3D91]' : done ? 'text-emerald-700' : 'text-gray-400'}`}>{s.label}</span>
          </li>
        )
      })}
    </ol>
  )
}

export default async function DevenirPartenairePage() {
  const supabase = await createClient()
  const state = await getPartnerState(supabase)

  // Partenaire (ou équipe IBIG) : direction la création de formation
  if (state.stage === 'partner') redirect('/formateur/formations/nouvelle')

  const app = state.application

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* En-tête */}
      <section className="ibig-gradient text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <p className="text-xs font-bold uppercase tracking-widest text-[#FFA500]">Programme Formateurs Partenaires</p>
          <h1 className="mt-2 text-[26px] sm:text-4xl font-extrabold leading-tight">Publiez vos formations avec IBIG EDUFORM</h1>
          <p className="mt-3 text-blue-100 text-[15px] sm:text-lg leading-relaxed">
            Partagez votre expertise avec des milliers d&apos;apprenants en Afrique francophone, encaissez votre part sur chaque vente
            et délivrez des certificats cosignés avec IBIG EDUFORM.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-5 pb-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <Stepper stage={state.stage} />
        </div>

        <div className="mt-5 space-y-5">
          {state.stage === 'account' && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7">
                <h2 className="text-xl font-bold text-gray-900">Comment ça marche</h2>
                <ol className="mt-4 space-y-4">
                  {[
                    { icon: UserPlus, t: 'Créez et confirmez votre compte', d: 'Inscription gratuite, puis confirmation de votre adresse email.' },
                    { icon: GraduationCap, t: 'Déposez votre candidature', d: 'Votre expertise, votre expérience et les formations que vous souhaitez créer.' },
                    { icon: FileSignature, t: 'Signez la convention de partenariat', d: 'IBIG EDUFORM vous propose ses conditions, dont votre part des revenus. Vous les acceptez en ligne.' },
                    { icon: Upload, t: 'Créez et soumettez vos formations', d: 'IBIG EDUFORM valide chaque formation puis la met en ligne.' },
                    { icon: Percent, t: 'Encaissez votre part', d: 'Chaque vente confirmée crédite automatiquement votre solde. Virement par Mobile Money ou banque.' },
                    { icon: Award, t: 'Certificats cosignés', d: 'Les certificats de vos apprenants portent votre signature et celle d\'IBIG EDUFORM.' },
                  ].map((s, i) => (
                    <li key={s.t} className="flex gap-3.5">
                      <span className="w-9 h-9 rounded-xl bg-[#0B3D91]/8 text-[#0B3D91] flex items-center justify-center flex-shrink-0"><s.icon className="w-[18px] h-[18px]" /></span>
                      <div>
                        <p className="font-semibold text-gray-900 text-[15px]">{i + 1}. {s.t}</p>
                        <p className="text-sm text-gray-500 leading-relaxed">{s.d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href="/inscription?next=/devenir-partenaire&profil=formateur"
                  className="flex items-center justify-center gap-2 py-3.5 rounded-xl ibig-gradient text-white font-bold">
                  Créer mon compte formateur <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/connexion?redirectTo=/devenir-partenaire"
                  className="flex items-center justify-center py-3.5 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold">
                  J&apos;ai déjà un compte
                </Link>
              </div>
              <p className="text-center text-xs text-gray-500">
                Consultez le modèle de <Link href="/conditions-partenaires" className="text-[#0B3D91] font-semibold underline">convention de partenariat</Link>.
              </p>
            </>
          )}

          {state.stage === 'confirm' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <MailCheck className="w-12 h-12 text-[#0B3D91] mx-auto" />
              <h2 className="mt-3 text-xl font-bold text-gray-900">Confirmez votre adresse email</h2>
              <p className="mt-2 text-gray-600 text-[15px]">Un lien de confirmation a été envoyé à <strong>{state.email}</strong>. Cliquez dessus, puis revenez sur cette page pour déposer votre candidature.</p>
            </div>
          )}

          {state.stage === 'review' && app && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-start gap-3">
                <Clock className="w-8 h-8 text-amber-500 flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Candidature en cours d&apos;examen</h2>
                  <p className="mt-1.5 text-gray-600 text-[15px] leading-relaxed">
                    Merci {app.full_name.split(' ')[0]} ! IBIG EDUFORM étudie votre profil, généralement sous 5 jours ouvrés.
                    Vous serez notifié dès que les conditions de partenariat vous seront proposées.
                  </p>
                  <p className="mt-3 text-xs text-gray-400">Déposée le {new Date(app.submitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <details className="mt-5 rounded-xl bg-gray-50 border border-gray-100">
                <summary className="px-4 py-3 text-sm font-semibold text-gray-700 cursor-pointer">Modifier ma candidature</summary>
                <div className="p-4 pt-0"><PartnerApplicationForm initial={app} profile={state.profile} /></div>
              </details>
            </div>
          )}

          {state.stage === 'apply' && (
            <>
              {app?.status === 'rejected' && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="font-bold text-amber-900">Modifications demandées par IBIG EDUFORM</p>
                  <p className="mt-1 text-amber-800 text-[15px] leading-relaxed whitespace-pre-line">{app.rejection_reason}</p>
                  <p className="mt-2 text-sm text-amber-700">Corrigez votre candidature ci-dessous puis renvoyez-la.</p>
                </div>
              )}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7">
                <h2 className="text-xl font-bold text-gray-900">Votre candidature de formateur partenaire</h2>
                <p className="mt-1 text-sm text-gray-500">Toutes les informations restent confidentielles et servent uniquement à l&apos;étude de votre dossier et au versement de vos revenus.</p>
                <div className="mt-5"><PartnerApplicationForm initial={app} profile={state.profile} /></div>
              </div>
            </>
          )}

          {state.stage === 'terms' && state.agreement && (
            <AgreementAcceptance agreement={state.agreement} defaultName={app?.signature_name ?? state.profile?.full_name ?? ''} />
          )}

          {state.stage === 'suspended' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <PauseCircle className="w-12 h-12 text-gray-400 mx-auto" />
              <h2 className="mt-3 text-xl font-bold text-gray-900">Partenariat suspendu</h2>
              <p className="mt-2 text-gray-600">{app?.admin_note || 'Contactez IBIG EDUFORM pour plus d\'informations.'}</p>
              <Link href="/contact" className="mt-4 inline-block text-[#0B3D91] font-semibold underline">Contacter IBIG EDUFORM</Link>
            </div>
          )}

          <div className="flex items-start gap-2.5 text-xs text-gray-500 px-1">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <p>Chaque formation est vérifiée par IBIG EDUFORM avant sa mise en ligne. Vos revenus sont calculés automatiquement à chaque paiement confirmé.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
