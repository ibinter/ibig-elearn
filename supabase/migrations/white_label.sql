-- Marque blanche : table tenants
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain TEXT NOT NULL UNIQUE,           -- ex: "total" → total.ibig-elearning.com
  custom_domain TEXT UNIQUE,                -- ex: "elearning.totalenergies.com"
  name TEXT NOT NULL,                       -- ex: "TotalEnergies Academy"
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#0B3D91',
  secondary_color TEXT NOT NULL DEFAULT '#FFA500',
  bg_color TEXT NOT NULL DEFAULT '#FFFFFF',
  text_color TEXT NOT NULL DEFAULT '#1A1A2E',
  hide_ibig_branding BOOLEAN NOT NULL DEFAULT false,
  custom_footer TEXT,
  allowed_categories TEXT[],               -- NULL = toutes les catégories
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour lookup rapide par subdomain / custom_domain
CREATE INDEX IF NOT EXISTS tenants_subdomain_idx ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS tenants_custom_domain_idx ON tenants(custom_domain) WHERE custom_domain IS NOT NULL;

-- RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Admins : accès total
CREATE POLICY "admins_all_tenants" ON tenants
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','coordinateur'))
  );

-- Public : lecture des tenants actifs (pour le middleware)
CREATE POLICY "public_read_active_tenants" ON tenants
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_tenants_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_tenants_updated_at();
