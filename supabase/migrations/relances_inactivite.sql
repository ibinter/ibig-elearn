-- Option E : Relances d'inactivité

-- Historique des campagnes de relance
CREATE TABLE IF NOT EXISTS relance_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  threshold_days INTEGER NOT NULL DEFAULT 14,
  segment TEXT DEFAULT 'all' CHECK (segment IN ('all', 'low_progress', 'never_started', 'almost_done')),
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  recipients_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'partial', 'failed')),
  triggered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logs individuels d'emails envoyés par campagne
CREATE TABLE IF NOT EXISTS relance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES relance_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  days_inactive INTEGER,
  progress_percent INTEGER,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_relance_logs_campaign ON relance_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_relance_logs_user ON relance_logs(user_id);

ALTER TABLE relance_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE relance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_relance_campaigns" ON relance_campaigns
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_all_relance_logs" ON relance_logs
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
