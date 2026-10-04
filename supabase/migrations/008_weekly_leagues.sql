-- ============================================================
-- Migration 008 : Ligues hebdomadaires
-- 30 apprenants/ligue, 5 divisions : Bronze → Argent → Or → Diamant → Élite
-- Chaque semaine : top 5 montent, bottom 5 descendent
-- ============================================================

-- Table des ligues (une instance par semaine + division)
CREATE TABLE IF NOT EXISTS public.leagues (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division      text NOT NULL CHECK (division IN ('Bronze','Argent','Or','Diamant','Élite')),
  week_start    date NOT NULL,
  week_end      date NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (division, week_start)
);

-- Table des participants à chaque ligue
CREATE TABLE IF NOT EXISTS public.league_participants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id       uuid NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp_start        integer NOT NULL DEFAULT 0,   -- XP au début de la semaine
  xp_gained       integer NOT NULL DEFAULT 0,   -- XP gagné pendant la semaine
  rank            integer,                        -- Classement final (calculé en fin de semaine)
  promoted        boolean,                        -- Monté de division ?
  relegated       boolean,                        -- Descendu de division ?
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (league_id, user_id)
);

-- Division actuelle de chaque utilisateur (dénormalisée pour lecture rapide)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS league_division text NOT NULL DEFAULT 'Bronze'
  CHECK (league_division IN ('Bronze','Argent','Or','Diamant','Élite'));

-- Index
CREATE INDEX IF NOT EXISTS idx_leagues_week_division
  ON public.leagues (week_start, division);

CREATE INDEX IF NOT EXISTS idx_league_participants_league
  ON public.league_participants (league_id, xp_gained DESC);

CREATE INDEX IF NOT EXISTS idx_league_participants_user
  ON public.league_participants (user_id, league_id);

-- ----------------------------------------------------------------
-- Fonction : assigner un utilisateur à la ligue de sa division
-- pour la semaine courante (idempotente)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_to_league(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_division    text;
  v_week_start  date;
  v_week_end    date;
  v_league_id   uuid;
  v_count       integer;
  v_xp          integer;
BEGIN
  -- Division et XP de l'utilisateur
  SELECT league_division, xp_points
  INTO v_division, v_xp
  FROM public.profiles WHERE id = p_user_id;

  -- Lundi de la semaine courante
  v_week_start := date_trunc('week', CURRENT_DATE)::date;
  v_week_end   := v_week_start + 6;

  -- Déjà dans une ligue cette semaine ?
  IF EXISTS (
    SELECT 1 FROM public.league_participants lp
    JOIN public.leagues l ON l.id = lp.league_id
    WHERE lp.user_id = p_user_id AND l.week_start = v_week_start
  ) THEN
    SELECT l.id INTO v_league_id
    FROM public.league_participants lp
    JOIN public.leagues l ON l.id = lp.league_id
    WHERE lp.user_id = p_user_id AND l.week_start = v_week_start;
    RETURN v_league_id;
  END IF;

  -- Trouver une ligue de sa division non pleine (< 30 membres)
  SELECT l.id, COUNT(lp.id)
  INTO v_league_id, v_count
  FROM public.leagues l
  LEFT JOIN public.league_participants lp ON lp.league_id = l.id
  WHERE l.division = v_division AND l.week_start = v_week_start
  GROUP BY l.id
  HAVING COUNT(lp.id) < 30
  ORDER BY COUNT(lp.id) DESC
  LIMIT 1;

  -- Aucune ligue disponible → en créer une nouvelle
  IF v_league_id IS NULL THEN
    INSERT INTO public.leagues (division, week_start, week_end)
    VALUES (v_division, v_week_start, v_week_end)
    RETURNING id INTO v_league_id;
  END IF;

  -- Inscrire l'utilisateur
  INSERT INTO public.league_participants (league_id, user_id, xp_start)
  VALUES (v_league_id, p_user_id, v_xp)
  ON CONFLICT (league_id, user_id) DO NOTHING;

  RETURN v_league_id;
END;
$$;

-- ----------------------------------------------------------------
-- Fonction : mettre à jour le xp_gained d'un participant
-- Appelée par award_xp après chaque gain XP
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_league_xp(p_user_id uuid, p_xp_gained integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start date := date_trunc('week', CURRENT_DATE)::date;
BEGIN
  UPDATE public.league_participants lp
  SET xp_gained = xp_gained + p_xp_gained
  FROM public.leagues l
  WHERE lp.league_id = l.id
    AND lp.user_id = p_user_id
    AND l.week_start = v_week_start;
END;
$$;

-- ----------------------------------------------------------------
-- Fonction : clôturer une ligue (appelée manuellement ou via cron)
-- Calcule les rangs, promus/relégués, met à jour les divisions
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.close_league(p_league_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_division    text;
  v_total       integer;
  v_promote_n   integer := 5;
  v_relegate_n  integer := 5;
  r             record;
  v_rank        integer := 0;
BEGIN
  SELECT division INTO v_division FROM public.leagues WHERE id = p_league_id;
  SELECT COUNT(*) INTO v_total FROM public.league_participants WHERE league_id = p_league_id;

  -- Assigner les rangs
  FOR r IN
    SELECT id, user_id,
           ROW_NUMBER() OVER (ORDER BY xp_gained DESC, created_at ASC) AS rn
    FROM public.league_participants
    WHERE league_id = p_league_id
  LOOP
    -- Promotion : top 5 sauf si déjà Élite
    UPDATE public.league_participants
    SET rank     = r.rn,
        promoted = (r.rn <= v_promote_n AND v_division <> 'Élite'),
        relegated= (r.rn > v_total - v_relegate_n AND v_division <> 'Bronze' AND v_total >= 10)
    WHERE id = r.id;
  END LOOP;

  -- Mettre à jour la division dans profiles
  UPDATE public.profiles p
  SET league_division = CASE
    WHEN lp.promoted THEN
      CASE v_division
        WHEN 'Bronze'   THEN 'Argent'
        WHEN 'Argent'   THEN 'Or'
        WHEN 'Or'       THEN 'Diamant'
        WHEN 'Diamant'  THEN 'Élite'
        ELSE 'Élite'
      END
    WHEN lp.relegated THEN
      CASE v_division
        WHEN 'Élite'    THEN 'Diamant'
        WHEN 'Diamant'  THEN 'Or'
        WHEN 'Or'       THEN 'Argent'
        WHEN 'Argent'   THEN 'Bronze'
        ELSE 'Bronze'
      END
    ELSE v_division
  END
  FROM public.league_participants lp
  WHERE lp.league_id = p_league_id AND p.id = lp.user_id;
END;
$$;

-- ----------------------------------------------------------------
-- Patch award_xp : ajouter l'appel update_league_xp + assign_to_league
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id   uuid,
  p_event_type text,
  p_xp        integer,
  p_ref_id    uuid    DEFAULT NULL,
  p_ref_label text    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile       public.profiles%ROWTYPE;
  v_today         date := CURRENT_DATE;
  v_new_streak    integer;
  v_new_longest   integer;
  v_streak_bonus  integer := 0;
  v_new_xp        integer;
  v_new_level     text;
  v_leveled_up    boolean := false;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'user not found');
  END IF;

  -- ---- Streak ----
  IF v_profile.last_activity_date IS NULL OR v_profile.last_activity_date < v_today - INTERVAL '1 day' THEN
    IF v_profile.last_activity_date = v_today - INTERVAL '1 day' THEN
      v_new_streak := v_profile.streak_days + 1;
    ELSE
      v_new_streak := 1;
    END IF;
  ELSE
    v_new_streak := v_profile.streak_days;
  END IF;

  v_new_longest := GREATEST(v_profile.longest_streak, v_new_streak);

  IF v_new_streak > v_profile.streak_days AND v_new_streak % 7 = 0 THEN
    v_streak_bonus := 50;
  END IF;

  -- ---- XP ----
  v_new_xp := v_profile.xp_points + p_xp + v_streak_bonus;

  -- ---- Niveau ----
  v_new_level := CASE
    WHEN v_new_xp >= 10000 THEN 'Maître IBIG'
    WHEN v_new_xp >= 4000  THEN 'Expert'
    WHEN v_new_xp >= 1500  THEN 'Pratiquant'
    WHEN v_new_xp >= 500   THEN 'Apprenti'
    ELSE 'Explorateur'
  END;

  v_leveled_up := v_new_level != v_profile.xp_level;

  -- ---- Mise à jour profiles ----
  UPDATE public.profiles SET
    xp_points          = v_new_xp,
    xp_level           = v_new_level,
    streak_days        = v_new_streak,
    longest_streak     = v_new_longest,
    last_activity_date = v_today
  WHERE id = p_user_id;

  -- ---- Log XP ----
  INSERT INTO public.xp_events (user_id, event_type, xp_gained, ref_id, ref_label, streak_day)
  VALUES (p_user_id, p_event_type, p_xp + v_streak_bonus, p_ref_id, p_ref_label, v_new_streak);

  IF v_streak_bonus > 0 THEN
    INSERT INTO public.xp_events (user_id, event_type, xp_gained, ref_label, streak_day)
    VALUES (p_user_id, 'streak_bonus', v_streak_bonus,
            v_new_streak || ' jours consécutifs ! 🔥', v_new_streak);
  END IF;

  -- ---- Ligues : assigner si pas encore fait + créditer XP ----
  PERFORM public.assign_to_league(p_user_id);
  PERFORM public.update_league_xp(p_user_id, p_xp + v_streak_bonus);

  RETURN jsonb_build_object(
    'xp_gained',    p_xp + v_streak_bonus,
    'xp_total',     v_new_xp,
    'level',        v_new_level,
    'leveled_up',   v_leveled_up,
    'streak',       v_new_streak,
    'streak_bonus', v_streak_bonus
  );
END;
$$;

-- ----------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_participants ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les ligues (classements publics)
CREATE POLICY "leagues_select_all" ON public.leagues
  FOR SELECT USING (true);

-- Tout le monde peut lire les participants (classements publics)
CREATE POLICY "league_participants_select_all" ON public.league_participants
  FOR SELECT USING (true);

-- Insert/update uniquement via SECURITY DEFINER functions
CREATE POLICY "league_participants_insert_fn" ON public.league_participants
  FOR INSERT WITH CHECK (false);

CREATE POLICY "league_participants_update_fn" ON public.league_participants
  FOR UPDATE USING (false);
