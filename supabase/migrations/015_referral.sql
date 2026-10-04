-- ============================================================
-- Migration 015 : Système de parrainage (referral)
-- ============================================================

DROP TABLE IF EXISTS public.referral_rewards CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;

-- 1. Table des parrainages
CREATE TABLE public.referrals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code   text NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','converted','rewarded')),
  converted_at    timestamptz,  -- quand le filleul a fait son premier achat
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referred_id)          -- un filleul ne peut avoir qu'un seul parrain
);

-- 2. Récompenses de parrainage
CREATE TABLE public.referral_rewards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id     uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('referrer','referred')),
  reward_type     text NOT NULL CHECK (reward_type IN ('xp','coupon','credit')),
  reward_value    integer NOT NULL,   -- XP ou % de réduction ou montant
  coupon_code     text,
  is_claimed      boolean NOT NULL DEFAULT false,
  claimed_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 3. Colonne referral_code sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- Générer un code pour les profils existants
UPDATE public.profiles
SET referral_code = UPPER(SUBSTRING(MD5(id::text) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- 4. Index
CREATE INDEX idx_referrals_referrer  ON public.referrals (referrer_id);
CREATE INDEX idx_referrals_code      ON public.referrals (referral_code);
CREATE INDEX idx_referral_rewards    ON public.referral_rewards (user_id, is_claimed);

-- 5. RLS
ALTER TABLE public.referrals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_own" ON public.referrals
  FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE POLICY "referral_rewards_own" ON public.referral_rewards
  FOR SELECT USING (user_id = auth.uid());

-- 6. Fonction : enregistrer un parrainage à l'inscription
CREATE OR REPLACE FUNCTION public.apply_referral_code(
  p_referred_id  uuid,
  p_code         text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
BEGIN
  -- Trouver le parrain
  SELECT id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = UPPER(p_code)
    AND id != p_referred_id
  LIMIT 1;

  IF NOT FOUND THEN RETURN false; END IF;

  -- Éviter les doublons
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = p_referred_id) THEN
    RETURN false;
  END IF;

  INSERT INTO public.referrals (referrer_id, referred_id, referral_code)
  VALUES (v_referrer_id, p_referred_id, UPPER(p_code));

  -- XP immédiat pour le filleul (+50 XP de bienvenue)
  PERFORM public.award_xp(p_referred_id, 50, 'referral_signup', NULL);

  -- Notification au parrain
  PERFORM public.create_notification(
    v_referrer_id, 'achievement',
    '🎉 Nouveau filleul !',
    'Quelqu''un vient de s''inscrire avec votre code de parrainage.',
    '/parrainage'
  );

  RETURN true;
END;
$$;

-- 7. Fonction : valider un parrainage après premier achat
CREATE OR REPLACE FUNCTION public.convert_referral(p_referred_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref record;
BEGIN
  SELECT * INTO v_ref
  FROM public.referrals
  WHERE referred_id = p_referred_id AND status = 'pending'
  LIMIT 1;

  IF NOT FOUND THEN RETURN; END IF;

  -- Marquer converti
  UPDATE public.referrals SET status = 'converted', converted_at = now() WHERE id = v_ref.id;

  -- Récompense parrain : +200 XP
  PERFORM public.award_xp(v_ref.referrer_id, 200, 'referral_converted', NULL);
  INSERT INTO public.referral_rewards (referral_id, user_id, type, reward_type, reward_value)
  VALUES (v_ref.id, v_ref.referrer_id, 'referrer', 'xp', 200);

  -- Récompense filleul : +100 XP
  PERFORM public.award_xp(p_referred_id, 100, 'referral_first_purchase', NULL);
  INSERT INTO public.referral_rewards (referral_id, user_id, type, reward_type, reward_value)
  VALUES (v_ref.id, p_referred_id, 'referred', 'xp', 100);

  -- Marquer récompensé
  UPDATE public.referrals SET status = 'rewarded' WHERE id = v_ref.id;

  -- Notifications
  PERFORM public.create_notification(
    v_ref.referrer_id, 'achievement',
    '💰 Parrainage validé — +200 XP !',
    'Votre filleul vient de faire son premier achat. Vous avez reçu 200 XP !',
    '/parrainage'
  );
  PERFORM public.create_notification(
    p_referred_id, 'achievement',
    '🎁 Bonus parrainage — +100 XP !',
    'Votre premier achat vous rapporte 100 XP bonus grâce au parrainage !',
    '/parrainage'
  );
END;
$$;

-- 8. Trigger : convertir le parrainage après premier paiement
CREATE OR REPLACE FUNCTION public.trigger_convert_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Vérifier si c'est le premier paiement
    IF NOT EXISTS (
      SELECT 1 FROM public.payments
      WHERE user_id = NEW.user_id AND status = 'completed' AND id != NEW.id
    ) THEN
      PERFORM public.convert_referral(NEW.user_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_convert_referral ON public.payments;
CREATE TRIGGER trg_convert_referral
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_convert_referral();

-- 9. Trigger : générer code referral à la création du profil
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.id::text || random()::text) FROM 1 FOR 8));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_referral_code ON public.profiles;
CREATE TRIGGER trg_generate_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.referral_code IS NULL)
  EXECUTE FUNCTION public.generate_referral_code();
