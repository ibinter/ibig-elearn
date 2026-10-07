import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Programme Formateurs Partenaires IBIG EDUFORM.
 *
 * Étapes : account → confirm → apply → review → terms → partner
 *  - account  : pas connecté
 *  - confirm  : email non confirmé
 *  - apply    : aucune candidature (ou refusée → nouvelle soumission possible)
 *  - review   : candidature en cours d'examen
 *  - terms    : conditions proposées, en attente d'acceptation
 *  - partner  : convention acceptée → peut créer et soumettre des formations
 *  - suspended: partenariat suspendu par EDUFORM
 */
export type PartnerStage = 'account' | 'confirm' | 'apply' | 'review' | 'terms' | 'partner' | 'suspended'

export const PARTNER_TERMS_VERSION = '2026-10'
export const DEFAULT_INSTRUCTOR_SHARE = 50

export type InstructorApplication = {
  id: string
  user_id: string
  status: 'submitted' | 'terms_offered' | 'accepted' | 'rejected' | 'suspended'
  full_name: string
  professional_title: string
  phone: string
  whatsapp: string | null
  country: string
  city: string
  expertise_domains: string[]
  years_experience: number
  bio: string
  linkedin_url: string | null
  website_url: string | null
  sample_content_url: string | null
  teaching_languages: string[]
  planned_courses: string
  legal_status: 'individual' | 'company'
  company_name: string | null
  tax_id: string | null
  payout_method: 'orange_money' | 'mtn_money' | 'wave' | 'moov_money' | 'bank_transfer'
  payout_account: string
  signature_name: string
  motivation: string | null
  admin_note: string | null
  rejection_reason: string | null
  submitted_at: string
  reviewed_at: string | null
}

export type PartnerAgreement = {
  id: string
  user_id: string
  status: 'offered' | 'accepted' | 'revoked'
  instructor_share_pct: number
  terms_version: string
  terms_snapshot: string
  special_conditions: string | null
  offered_at: string
  accepted_at: string | null
  signature_name: string | null
}

export type PartnerState = {
  stage: PartnerStage
  userId: string | null
  email: string | null
  isStaff: boolean
  profile: { full_name: string; role: string; is_partner: boolean; partner_share_pct: number | null; country: string | null; phone: string | null } | null
  application: InstructorApplication | null
  agreement: PartnerAgreement | null
}

export const PAYOUT_METHODS: Record<InstructorApplication['payout_method'], string> = {
  orange_money: 'Orange Money',
  mtn_money: 'MTN Mobile Money',
  wave: 'Wave',
  moov_money: 'Moov Money',
  bank_transfer: 'Virement bancaire',
}

export const EXPERTISE_DOMAINS = [
  'Comptabilité & Finance', 'Gestion & Entrepreneuriat', 'Marketing & Commerce', 'Numérique & Informatique',
  'IA & Digitalisation', 'Management & Leadership', 'Ressources Humaines', 'Communication & Médias',
  'Droit & Juridique', 'Banque & Assurance', 'Immobilier & BTP', 'Agriculture & Agroalimentaire',
  'Santé & Social', 'Logistique & Supply Chain', 'QHSE & Environnement', 'Langues', 'Développement personnel', 'Autre',
]

export async function getPartnerState(supabase: SupabaseClient): Promise<PartnerState> {
  const { data: { user } } = await supabase.auth.getUser()
  const empty: PartnerState = { stage: 'account', userId: null, email: null, isStaff: false, profile: null, application: null, agreement: null }
  if (!user) return empty

  const [{ data: profile }, { data: application }, { data: agreements }] = await Promise.all([
    supabase.from('profiles').select('full_name, role, is_partner, partner_share_pct, country, phone').eq('id', user.id).single(),
    supabase.from('instructor_applications').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('partner_agreements').select('*').eq('user_id', user.id).order('offered_at', { ascending: false }).limit(1),
  ])

  const isStaff = ['admin', 'coordinateur'].includes((profile as { role?: string } | null)?.role ?? '')
  const agreement = (agreements?.[0] ?? null) as PartnerAgreement | null
  const app = (application ?? null) as InstructorApplication | null
  const base = { userId: user.id, email: user.email ?? null, isStaff, profile: profile as PartnerState['profile'], application: app, agreement }

  let stage: PartnerStage
  if (isStaff || (profile as { is_partner?: boolean } | null)?.is_partner) stage = 'partner'
  else if (!user.email_confirmed_at) stage = 'confirm'
  else if (app?.status === 'suspended') stage = 'suspended'
  else if (agreement?.status === 'offered' && app?.status === 'terms_offered') stage = 'terms'
  else if (app?.status === 'submitted') stage = 'review'
  else stage = 'apply'

  return { ...base, stage }
}

/** Texte intégral de la convention de partenariat (archivé tel quel lors de l'offre). */
export function buildPartnerTerms(opts: { instructorName: string; sharePct: number; specialConditions?: string | null }): string {
  const share = Number(opts.sharePct)
  const eduform = Math.round((100 - share) * 100) / 100
  return `CONVENTION DE PARTENARIAT — FORMATEUR PARTENAIRE IBIG EDUFORM
Version ${PARTNER_TERMS_VERSION}

Entre IBIG SARL — pôle IBIG EDUFORM, Abidjan, Cocody Riviera Palmeraie, Côte d'Ivoire (« IBIG EDUFORM »),
et ${opts.instructorName} (« le Formateur Partenaire »).

1. OBJET
Le Formateur Partenaire conçoit et publie des formations sur la plateforme IBIG E-LEARNING (ibig-elearning.com). IBIG EDUFORM assure l'hébergement, la diffusion, l'encaissement des paiements, le support aux apprenants et la délivrance des certificats.

2. VALIDATION ET PUBLICATION
Chaque formation est soumise à IBIG EDUFORM, qui vérifie sa qualité pédagogique, son exactitude et sa conformité. IBIG EDUFORM peut demander des modifications, refuser ou retirer une formation. Seule IBIG EDUFORM met une formation en ligne.

3. PARTAGE DES REVENUS
Pour chaque vente confirmée, le revenu net encaissé est partagé ainsi :
— Formateur Partenaire : ${share} %
— IBIG EDUFORM : ${eduform} %
La part du Formateur est créditée sur son solde à la confirmation du paiement. En cas de remboursement, la part correspondante est déduite. Le Formateur peut demander un virement depuis son espace dès que son solde atteint le seuil minimum indiqué sur la plateforme ; les virements sont effectués par Mobile Money ou virement bancaire.

4. PROPRIÉTÉ INTELLECTUELLE
Le Formateur reste propriétaire de ses contenus. Il garantit en détenir tous les droits et concède à IBIG EDUFORM, pendant la durée du partenariat, une licence non exclusive de diffusion, d'adaptation technique (encodage, sous-titrage, traduction de l'interface) et de promotion. Les apprenants inscrits conservent leur accès après la fin du partenariat.

5. QUALITÉ ET ENGAGEMENTS DU FORMATEUR
Le Formateur s'engage à fournir des contenus originaux, exacts et à jour ; à répondre aux questions des apprenants dans un délai raisonnable ; à respecter les Conditions Générales d'Utilisation de la plateforme ; et à ne pas détourner les apprenants vers d'autres canaux de vente.

6. CERTIFICATS COSIGNÉS
Les attestations et certificats délivrés aux apprenants ayant validé une formation du Formateur sont cosignés par le Formateur Partenaire et par IBIG EDUFORM. Le Formateur autorise l'apposition de son nom et de sa signature sur ces documents.

7. OBLIGATIONS FISCALES
Le Formateur est responsable de la déclaration de ses revenus et de ses obligations fiscales et sociales dans son pays.

8. DURÉE ET RÉSILIATION
La présente convention prend effet à son acceptation pour une durée indéterminée. Chaque partie peut y mettre fin avec un préavis de 30 jours. IBIG EDUFORM peut suspendre le partenariat sans préavis en cas de manquement grave (fraude, contenu illicite, atteinte aux droits de tiers).

9. DROIT APPLICABLE
La présente convention est régie par le droit ivoirien et le droit OHADA. Tout litige sera soumis aux juridictions compétentes d'Abidjan.${opts.specialConditions?.trim() ? `

10. CONDITIONS PARTICULIÈRES
${opts.specialConditions.trim()}` : ''}

Acceptation électronique : en saisissant son nom complet et en validant, le Formateur Partenaire signe la présente convention. La date, l'heure et l'adresse IP de l'acceptation sont enregistrées.`
}
