-- ============================================================
-- IBIG E-LEARN — Migrations en attente
-- Exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Learning Paths (Parcours de formation)
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  short_description text,
  thumbnail_url text,
  level text DEFAULT 'tous_niveaux',
  estimated_hours int DEFAULT 0,
  is_published boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_path_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid REFERENCES learning_paths(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  position int DEFAULT 0,
  is_required boolean DEFAULT true,
  UNIQUE(path_id, course_id)
);

CREATE TABLE IF NOT EXISTS learning_path_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid REFERENCES learning_paths(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(path_id, user_id)
);

ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learning_paths_public_read" ON learning_paths FOR SELECT USING (is_published = true);
CREATE POLICY "learning_paths_admin_all" ON learning_paths FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinateur'))
);
CREATE POLICY "lp_courses_read" ON learning_path_courses FOR SELECT USING (
  EXISTS (SELECT 1 FROM learning_paths WHERE id = path_id AND is_published = true)
);
CREATE POLICY "lp_courses_admin" ON learning_path_courses FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinateur'))
);
CREATE POLICY "lp_enrollments_own" ON learning_path_enrollments FOR ALL USING (user_id = auth.uid());
CREATE POLICY "lp_enrollments_admin" ON learning_path_enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinateur'))
);


-- 2. Platform Settings (Paramètres de la plateforme)
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  label text,
  category text DEFAULT 'general',
  updated_at timestamptz DEFAULT now()
);

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

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_admin_all" ON platform_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinateur'))
);


-- 3. Notifications (Système de notifications temps réel)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own" ON notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "notifications_admin_insert" ON notifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinateur', 'formateur'))
);
