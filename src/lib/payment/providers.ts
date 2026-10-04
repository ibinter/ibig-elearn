// ============================================================
// Registre des providers de paiement IBIG E-LEARNING
// Pour ajouter un provider : créer un fichier src/app/api/payment/<nom>/route.ts
// et l'enregistrer ici.
// ============================================================

export interface PaymentProvider {
  id: string
  name: string
  label: string
  description: string
  countries: string[]           // Pays couverts (ISO 3166-1 alpha-2)
  currencies: string[]          // Devises acceptées
  methods: string[]             // Types de paiement proposés
  apiRoute: string              // Route API interne
  available: boolean            // Activé en production
  logo?: string                 // Chemin logo dans /public
}

export const PAYMENT_PROVIDERS: PaymentProvider[] = [
  {
    id: 'cinetpay',
    name: 'CinetPay',
    label: 'Mobile Money & Cartes (Afrique)',
    description: 'Orange Money, MTN MoMo, Wave, Moov, Carte Visa/Mastercard',
    countries: ['CI','SN','ML','BF','GN','CM','CG','CD','TG','BJ','GA','NE','MG','TN','MA','DZ','RW'],
    currencies: ['XOF','XAF','USD','EUR'],
    methods: ['Orange Money','MTN Mobile','Wave','Moov Money','Carte Visa/MC'],
    apiRoute: '/api/payment/cinetpay',
    available: true,
  },
  {
    id: 'stripe',
    name: 'Stripe',
    label: 'Carte bancaire (Europe/Diaspora)',
    description: 'Visa, Mastercard, Apple Pay, Google Pay — Europe et diaspora uniquement',
    countries: ['FR','BE','CH','DE','IT','ES','PT','NL','AT','LU','GB','SE','NO','DK','FI','CA','US','AU'],
    currencies: ['EUR','USD','GBP','CAD','AUD'],
    methods: ['Visa','Mastercard','Apple Pay','Google Pay'],
    apiRoute: '/api/payment/stripe',
    available: true,
  },

  // ---- À brancher ultérieurement ----

  {
    id: 'flutterwave',
    name: 'Flutterwave',
    label: 'Mobile Money & Cartes (Afrique anglophone)',
    description: 'M-Pesa, MTN, Airtel — Nigeria, Kenya, Ghana, Tanzanie, Ouganda',
    countries: ['NG','KE','GH','TZ','UG','ZA','RW','ZM','ZW','CM','CI'],
    currencies: ['NGN','KES','GHS','TZS','UGX','ZAR','XOF','XAF','USD'],
    methods: ['M-Pesa','MTN Mobile','Airtel Money','Card','Bank Transfer'],
    apiRoute: '/api/payment/flutterwave',
    available: false, // À activer quand branché
  },
  {
    id: 'paystack',
    name: 'Paystack',
    label: 'Cartes & transferts (Nigeria/Ghana)',
    description: 'Visa, Mastercard, USSD, Bank Transfer — Nigeria, Ghana, Kenya',
    countries: ['NG','GH','KE','ZA'],
    currencies: ['NGN','GHS','KES','ZAR','USD'],
    methods: ['Card','USSD','Bank Transfer','Mobile Money'],
    apiRoute: '/api/payment/paystack',
    available: false,
  },
  {
    id: 'paydunya',
    name: 'PayDunya',
    label: 'Mobile Money (Sénégal / Mali / Burkina)',
    description: 'Orange Money, MTN, Expresso — spécialisé Sénégal, Mali, Burkina Faso',
    countries: ['SN','ML','BF','GN','CI'],
    currencies: ['XOF'],
    methods: ['Orange Money','MTN Mobile','Expresso Money','Carte Visa'],
    apiRoute: '/api/payment/paydunya',
    available: false,
  },
  {
    id: 'kkiapay',
    name: 'KKiaPay',
    label: 'Mobile Money (Bénin / Togo / Niger)',
    description: 'MTN, Moov — Bénin, Togo, Niger, Côte d\'Ivoire',
    countries: ['BJ','TG','NE','CI','SN'],
    currencies: ['XOF'],
    methods: ['MTN Mobile Money','Moov Money','Carte Visa'],
    apiRoute: '/api/payment/kkiapay',
    available: false,
  },
  {
    id: 'wave',
    name: 'Wave',
    label: 'Wave (CI / SN / ML / BF)',
    description: 'Paiement direct Wave — 1% de commission seulement',
    countries: ['CI','SN','ML','BF','UG'],
    currencies: ['XOF'],
    methods: ['Wave'],
    apiRoute: '/api/payment/wave',
    available: false, // 1% commission — à prioriser
  },
]

// Retourne les providers disponibles pour un pays et une devise donnés
export function getProvidersForCountry(country: string, currency?: string): PaymentProvider[] {
  return PAYMENT_PROVIDERS.filter(p =>
    p.available &&
    (p.countries.includes(country) || p.countries.length === 0) &&
    (currency ? p.currencies.includes(currency) : true)
  )
}

// Retourne le provider recommandé pour un pays
export function getRecommendedProvider(country: string): PaymentProvider {
  const available = getProvidersForCountry(country)
  // Priorité : Wave (1% comm) > CinetPay > Stripe > premier dispo
  const priority = ['wave', 'cinetpay', 'stripe', 'flutterwave', 'paystack', 'paydunya', 'kkiapay']
  for (const id of priority) {
    const p = available.find(x => x.id === id)
    if (p) return p
  }
  return PAYMENT_PROVIDERS.find(p => p.id === 'cinetpay')!
}
