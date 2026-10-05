-- ============================================================
-- Migration 026 : Ajout de GeniusPay comme provider de paiement par défaut
-- ============================================================

-- Déplacer les providers existants (décaler leur position)
UPDATE payment_providers SET position = position + 1;

-- Désactiver is_default sur tous les providers existants
UPDATE payment_providers SET is_default = false;

-- Insérer GeniusPay en position 1 (provider par défaut)
-- Note : id est un text PRIMARY KEY (ex: 'cinetpay', 'stripe')
INSERT INTO payment_providers (
  id,
  name,
  label,
  description,
  is_default,
  api_route,
  currencies,
  methods,
  region,
  countries,
  is_active,
  position
) VALUES (
  'geniuspay',
  'GeniusPay',
  'GeniusPay — Mobile Money & Cartes',
  'Wave, Orange Money, MTN MoMo, Moov Money, Carte Visa/Mastercard — Page checkout unifiée GeniusPay',
  true,
  '/api/payment/geniuspay',
  ARRAY['XOF', 'XAF', 'USD', 'EUR'],
  ARRAY['Wave', 'Orange Money', 'MTN MoMo', 'Moov Money', 'Carte Visa/MC'],
  'africa',
  ARRAY['CI','SN','ML','BF','BJ','TG','CM','CG','CD','RW','KE','UG','GH','NG','GA','NE','SL','ZM'],
  true,
  1
);
