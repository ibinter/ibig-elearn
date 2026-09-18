-- Système de parrainage IBIG E-LEARN
CREATE TABLE IF NOT EXISTS referrals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  code          TEXT NOT NULL UNIQUE,
  email         TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending | registered | rewarded
  reward_points INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  rewarded_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(code);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Service manage referrals" ON referrals FOR ALL USING (true) WITH CHECK (true);

-- Ajouter colonne referral_code au profil (null si pas de parrainage reçu)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);
