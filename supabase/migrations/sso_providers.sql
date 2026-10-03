-- SSO Providers par organisation B2B
CREATE TABLE IF NOT EXISTS sso_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES b2b_organizations(id) ON DELETE CASCADE,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('google','microsoft','saml','oidc')),
  -- Domaines email autorisés (ex: ['totalenergies.com','total.com'])
  email_domains TEXT[] NOT NULL DEFAULT '{}',
  -- Config OIDC/OAuth2
  client_id TEXT,
  client_secret TEXT,
  -- OIDC: issuer URL (ex: https://accounts.google.com)
  issuer_url TEXT,
  -- SAML: metadata URL ou XML
  saml_metadata_url TEXT,
  saml_metadata_xml TEXT,
  -- Redirect après SSO login
  redirect_url TEXT,
  -- Labels
  button_label TEXT NOT NULL DEFAULT 'Se connecter via SSO',
  button_logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sso_providers_org_idx ON sso_providers(org_id);

-- RLS
ALTER TABLE sso_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_all_sso" ON sso_providers
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','coordinateur'))
  );

-- Public : lecture des providers actifs (pour détecter le domaine email)
CREATE POLICY "public_read_active_sso" ON sso_providers
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_sso_providers_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER sso_providers_updated_at BEFORE UPDATE ON sso_providers
  FOR EACH ROW EXECUTE FUNCTION update_sso_providers_updated_at();
