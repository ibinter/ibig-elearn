-- ============================================================
-- Migration 005 : Providers de paiement gérés en base
-- ============================================================

CREATE TABLE public.payment_providers (
  id text PRIMARY KEY,                          -- 'cinetpay', 'stripe', 'wave', etc.
  name text NOT NULL,
  label text NOT NULL,
  description text,
  logo_url text,
  api_route text NOT NULL,                      -- Route API interne Next.js
  is_active boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,          -- Ordre d'affichage
  countries text[] NOT NULL DEFAULT '{}',       -- [] = tous les pays
  currencies text[] NOT NULL DEFAULT '{}',
  methods text[] NOT NULL DEFAULT '{}',         -- Labels affichés à l'utilisateur
  region text NOT NULL DEFAULT 'africa'         -- 'africa' | 'europe' | 'global'
    CHECK (region IN ('africa','europe','global')),
  config jsonb NOT NULL DEFAULT '{}',           -- Clés API (côté serveur uniquement)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Un seul provider par défaut à la fois
CREATE UNIQUE INDEX idx_payment_providers_default
  ON public.payment_providers (is_default)
  WHERE is_default = true;

ALTER TABLE public.payment_providers ENABLE ROW LEVEL SECURITY;

-- Lecture publique (le frontend a besoin de la liste des providers actifs)
CREATE POLICY "Lecture publique providers actifs" ON public.payment_providers
  FOR SELECT USING (is_active = true OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','coordinateur')));

-- Seuls les admins peuvent modifier
CREATE POLICY "Admin gère providers" ON public.payment_providers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','coordinateur'))
  );

-- ============================================================
-- Données initiales
-- ============================================================
INSERT INTO public.payment_providers
  (id, name, label, description, api_route, is_active, is_default, position, countries, currencies, methods, region)
VALUES
  (
    'cinetpay',
    'CinetPay',
    'Mobile Money & Cartes',
    'Orange Money, MTN MoMo, Wave, Moov, Carte Visa/Mastercard — 17 pays africains francophones',
    '/api/payment/cinetpay',
    true,   -- actif
    true,   -- par défaut
    1,
    ARRAY['CI','SN','ML','BF','GN','CM','CG','CD','TG','BJ','GA','NE','MG','TN','MA','DZ','RW'],
    ARRAY['XOF','XAF','USD','EUR'],
    ARRAY['Orange Money','MTN Mobile','Wave','Moov Money','Carte Visa/MC'],
    'africa'
  ),
  (
    'stripe',
    'Stripe',
    'Carte bancaire Europe / Diaspora',
    'Visa, Mastercard, Apple Pay, Google Pay — Europe et diaspora uniquement',
    '/api/payment/stripe',
    true,   -- actif
    false,
    2,
    ARRAY['FR','BE','CH','DE','IT','ES','PT','NL','AT','LU','GB','SE','NO','DK','FI','CA','US','AU'],
    ARRAY['EUR','USD','GBP','CAD','AUD'],
    ARRAY['Visa','Mastercard','Apple Pay','Google Pay'],
    'europe'
  ),
  (
    'wave',
    'Wave',
    'Wave (1% commission)',
    'Paiement direct Wave — commission 1% seulement. CI, SN, ML, BF, UG',
    '/api/payment/wave',
    false,  -- inactif — à activer quand branché
    false,
    3,
    ARRAY['CI','SN','ML','BF','UG'],
    ARRAY['XOF'],
    ARRAY['Wave'],
    'africa'
  ),
  (
    'flutterwave',
    'Flutterwave',
    'Mobile Money Afrique anglophone',
    'M-Pesa, MTN, Airtel — Nigeria, Kenya, Ghana, Tanzanie, Ouganda',
    '/api/payment/flutterwave',
    false,
    false,
    4,
    ARRAY['NG','KE','GH','TZ','UG','ZA','RW','ZM'],
    ARRAY['NGN','KES','GHS','TZS','UGX','ZAR','USD'],
    ARRAY['M-Pesa','MTN Mobile','Airtel Money','Card'],
    'africa'
  ),
  (
    'paystack',
    'Paystack',
    'Cartes & transferts Nigeria / Ghana',
    'Visa, Mastercard, USSD, virement bancaire',
    '/api/payment/paystack',
    false,
    false,
    5,
    ARRAY['NG','GH','KE','ZA'],
    ARRAY['NGN','GHS','KES','ZAR','USD'],
    ARRAY['Card','USSD','Bank Transfer','Mobile Money'],
    'africa'
  ),
  (
    'paydunya',
    'PayDunya',
    'Mobile Money Sénégal / Mali / Burkina',
    'Orange Money, MTN, Expresso — spécialisé Sénégal, Mali, Burkina Faso',
    '/api/payment/paydunya',
    false,
    false,
    6,
    ARRAY['SN','ML','BF','GN','CI'],
    ARRAY['XOF'],
    ARRAY['Orange Money','MTN Mobile','Expresso Money'],
    'africa'
  ),
  (
    'kkiapay',
    'KKiaPay',
    'Mobile Money Bénin / Togo / Niger',
    'MTN, Moov — Bénin, Togo, Niger, Côte d''Ivoire',
    '/api/payment/kkiapay',
    false,
    false,
    7,
    ARRAY['BJ','TG','NE','CI','SN'],
    ARRAY['XOF'],
    ARRAY['MTN Mobile Money','Moov Money'],
    'africa'
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER payment_providers_updated_at
  BEFORE UPDATE ON public.payment_providers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
