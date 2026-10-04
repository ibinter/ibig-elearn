-- ============================================================
-- Migration 006 : Gamification — XP, Streaks, Niveaux IBIG
-- ============================================================

-- Colonnes XP + streak sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp_points       integer  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_level        text     NOT NULL DEFAULT 'Explorateur'
    CHECK (xp_level IN ('Explorateur','Apprenti','Pratiquant','Expert','Maître IBIG')),
  ADD COLUMN IF NOT EXISTS streak_days     integer  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak  integer  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_date date  DEFAULT NULL;

-- Table des événements XP (historique complet)
CREATE TABLE IF NOT EXISTS public.xp_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type   text        NOT NULL,   -- 'lesson_completed', 'quiz_passed', 'module_completed', 'course_completed', 'daily_streak', 'assignment_passed'
  xp_gained    integer     NOT NULL,
  ref_id       uuid,                   -- lesson_id, module_id ou course_id selon event_type
  ref_label    text,                   -- titre pour affichage
  streak_day   integer,                -- valeur du streak au moment de l'event
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_xp_events_user_created ON public.xp_events (user_id, created_at DESC);

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture propre xp_events" ON public.xp_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Insert propre xp_events" ON public.xp_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Fonction : award_xp
-- Attribue des XP, met à jour le niveau, gère le streak.
-- Appelée côté serveur (service_role) après completion leçon/quiz.
-- ============================================================
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id    uuid,
  p_event_type text,
  p_xp         integer,
  p_ref_id     uuid    DEFAULT NULL,
  p_ref_label  text    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile       public.profiles%ROWTYPE;
  v_new_xp        integer;
  v_new_level     text;
  v_new_streak    integer;
  v_new_longest   integer;
  v_today         date := current_date;
  v_streak_bonus  integer := 0;
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
      v_new_streak := 1;  -- reset
    END IF;
  ELSE
    v_new_streak := v_profile.streak_days;  -- déjà actif aujourd'hui
  END IF;

  v_new_longest := GREATEST(v_profile.longest_streak, v_new_streak);

  -- Bonus streak (multiples de 7)
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

  -- ---- Log de l'événement XP ----
  INSERT INTO public.xp_events (user_id, event_type, xp_gained, ref_id, ref_label, streak_day)
  VALUES (p_user_id, p_event_type, p_xp + v_streak_bonus, p_ref_id, p_ref_label, v_new_streak);

  -- ---- Log bonus streak séparé ----
  IF v_streak_bonus > 0 THEN
    INSERT INTO public.xp_events (user_id, event_type, xp_gained, ref_label, streak_day)
    VALUES (p_user_id, 'streak_bonus', v_streak_bonus,
            v_new_streak || ' jours consécutifs ! 🔥', v_new_streak);
  END IF;

  RETURN jsonb_build_object(
    'xp_gained',   p_xp + v_streak_bonus,
    'xp_total',    v_new_xp,
    'level',       v_new_level,
    'leveled_up',  v_leveled_up,
    'streak',      v_new_streak,
    'streak_bonus',v_streak_bonus
  );
END;
$$;

-- ============================================================
-- Synchronisation : aligne total_points loyalty → xp_points
-- pour les comptes existants (une seule fois)
-- ============================================================
UPDATE public.profiles
SET xp_points = COALESCE(loyalty_points_total, 0)
WHERE xp_points = 0 AND COALESCE(loyalty_points_total, 0) > 0;
