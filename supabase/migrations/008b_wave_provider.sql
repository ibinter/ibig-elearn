-- Ajouter Wave comme provider de paiement
-- Wave : 1% de commission, Sénégal + Côte d'Ivoire principalement

INSERT INTO public.payment_providers (
  id, name, label, description,
  is_active, is_default, api_route,
  currencies, methods, region,
  countries, position
)
VALUES (
  'wave',
  'Wave',
  'Wave Money — Paiement instantané',
  'Payez en quelques secondes avec Wave. Commission 1% — le moins cher du marché.',
  true,
  false,
  '/api/payment/wave',
  ARRAY['XOF'],
  ARRAY['Wave Mobile Money'],
  'africa',
  ARRAY['SN','CI','ML','GN','BF','UG','TZ','GH','CM'],
  2   -- juste après CinetPay
)
ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  label       = EXCLUDED.label,
  description = EXCLUDED.description,
  is_active   = EXCLUDED.is_active,
  api_route   = EXCLUDED.api_route,
  currencies  = EXCLUDED.currencies,
  methods     = EXCLUDED.methods,
  region      = EXCLUDED.region,
  countries   = EXCLUDED.countries,
  position    = EXCLUDED.position;
