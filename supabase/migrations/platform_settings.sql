CREATE TABLE IF NOT EXISTS platform_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  label text,
  category text DEFAULT 'general',
  updated_at timestamptz DEFAULT now()
);

-- Default values
INSERT INTO platform_settings (key, value, label, category) VALUES
  ('platform_name', 'IBIG E-LEARN', 'Nom de la plateforme', 'general'),
  ('platform_domain', 'ibiglearn.com', 'Domaine', 'general'),
  ('contact_email', 'contact@ibiglearn.com', 'Email de contact', 'general'),
  ('default_language', 'fr', 'Langue par défaut', 'general'),
  ('default_currency', 'XOF', 'Devise par défaut', 'general'),
  ('platform_commission_pct', '20', 'Commission plateforme (%)', 'payment'),
  ('refund_days', '7', 'Garantie remboursement (jours)', 'payment'),
  ('email_confirmation', 'true', 'Email confirmation inscription', 'email'),
  ('email_payment', 'true', 'Email confirmation paiement', 'email'),
  ('email_certificate', 'true', 'Email certificat de réussite', 'email'),
  ('email_reminder', 'false', 'Email rappel de formation', 'email'),
  ('email_newsletter', 'false', 'Newsletter mensuelle', 'email'),
  ('maintenance_mode', 'false', 'Mode maintenance', 'system')
ON CONFLICT (key) DO NOTHING;

-- RLS: only admins can read/write
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_admin_all" ON platform_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinateur'))
);
