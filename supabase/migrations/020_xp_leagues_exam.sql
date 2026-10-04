-- ============================================================
-- Migration 020 : XP, Ligues hebdomadaires, Examens finaux
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. COLONNES PROFILES (XP + division de ligue)
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp_points       integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_level        text    NOT NULL DEFAULT 'Débutant',
  ADD COLUMN IF NOT EXISTS league_division text    NOT NULL DEFAULT 'Bronze'
    CHECK (league_division IN ('Bronze','Argent','Or','Diamant','Élite')),
  ADD COLUMN IF NOT EXISTS league_streak   integer NOT NULL DEFAULT 0,
  -- Onboarding
  ADD COLUMN IF NOT EXISTS onboarding_done boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS goals           text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interests       text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS learning_frequency text;

-- ────────────────────────────────────────────────────────────
-- 2. TABLE xp_events
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.xp_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type  text        NOT NULL,
  xp          integer     NOT NULL CHECK (xp > 0),
  ref_id      uuid,
  ref_label   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS xp_events_user_id_idx ON public.xp_events(user_id);
CREATE INDEX IF NOT EXISTS xp_events_created_at_idx ON public.xp_events(created_at);

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "xp_events_select_own"     ON public.xp_events;
DROP POLICY IF EXISTS "xp_events_insert_service" ON public.xp_events;
CREATE POLICY "xp_events_select_own" ON public.xp_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "xp_events_insert_service" ON public.xp_events
  FOR INSERT WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- 3. FONCTION award_xp
-- Incrémente xp_points du profil + calcule le niveau + insère l'event
-- ────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.award_xp(uuid,text,integer,uuid,text);
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
  v_new_xp     integer;
  v_new_level  text;
BEGIN
  -- Insérer l'événement XP
  INSERT INTO public.xp_events(user_id, event_type, xp, ref_id, ref_label)
  VALUES (p_user_id, p_event_type, p_xp, p_ref_id, p_ref_label);

  -- Mettre à jour le total
  UPDATE public.profiles
  SET xp_points = xp_points + p_xp
  WHERE id = p_user_id
  RETURNING xp_points INTO v_new_xp;

  -- Calculer le niveau
  v_new_level := CASE
    WHEN v_new_xp >= 5000 THEN 'Expert'
    WHEN v_new_xp >= 2000 THEN 'Avancé'
    WHEN v_new_xp >= 750  THEN 'Intermédiaire'
    WHEN v_new_xp >= 200  THEN 'Apprenti'
    ELSE 'Débutant'
  END;

  UPDATE public.profiles SET xp_level = v_new_level WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'xp_gained',  p_xp,
    'total_xp',   v_new_xp,
    'level',      v_new_level
  );
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 4. TABLES LIGUES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.leagues (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  division    text  NOT NULL CHECK (division IN ('Bronze','Argent','Or','Diamant','Élite')),
  week_start  date  NOT NULL,
  week_end    date  NOT NULL,
  group_index integer NOT NULL DEFAULT 1,  -- plusieurs groupes par division si >30
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (division, week_start, group_index)
);

CREATE TABLE IF NOT EXISTS public.league_participants (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id   uuid    NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id     uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp_gained   integer NOT NULL DEFAULT 0,
  rank        integer,
  promoted    boolean DEFAULT false,
  relegated   boolean DEFAULT false,
  joined_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (league_id, user_id)
);

CREATE INDEX IF NOT EXISTS league_participants_league_id_idx ON public.league_participants(league_id);
CREATE INDEX IF NOT EXISTS league_participants_user_id_idx   ON public.league_participants(user_id);

ALTER TABLE public.leagues              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_participants  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leagues_select_all"              ON public.leagues;
DROP POLICY IF EXISTS "league_participants_select_all"  ON public.league_participants;
DROP POLICY IF EXISTS "league_participants_update_own"  ON public.league_participants;
CREATE POLICY "leagues_select_all" ON public.leagues FOR SELECT USING (true);
CREATE POLICY "league_participants_select_all" ON public.league_participants
  FOR SELECT USING (true);
CREATE POLICY "league_participants_update_own" ON public.league_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 5. FONCTION assign_to_league
-- Crée la ligue de la semaine si elle n'existe pas encore,
-- et inscrit l'utilisateur (max 30 par groupe)
-- ────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.assign_to_league(uuid);
CREATE OR REPLACE FUNCTION public.assign_to_league(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_division    text;
  v_week_start  date;
  v_week_end    date;
  v_league_id   uuid;
  v_count       integer;
  v_group       integer := 1;
BEGIN
  -- Récupérer la division actuelle de l'utilisateur
  SELECT league_division INTO v_division
  FROM public.profiles WHERE id = p_user_id;

  -- Lundi de la semaine courante
  v_week_start := date_trunc('week', current_date)::date;
  v_week_end   := v_week_start + 6;

  -- Déjà inscrit cette semaine ?
  SELECT lp.league_id INTO v_league_id
  FROM public.league_participants lp
  JOIN public.leagues l ON l.id = lp.league_id
  WHERE lp.user_id = p_user_id
    AND l.week_start = v_week_start
    AND l.division = v_division;

  IF v_league_id IS NOT NULL THEN
    RETURN; -- déjà dans une ligue
  END IF;

  -- Trouver un groupe avec de la place (< 30 participants)
  LOOP
    SELECT l.id, COUNT(lp.id) INTO v_league_id, v_count
    FROM public.leagues l
    LEFT JOIN public.league_participants lp ON lp.league_id = l.id
    WHERE l.division = v_division
      AND l.week_start = v_week_start
      AND l.group_index = v_group
    GROUP BY l.id;

    IF v_league_id IS NULL THEN
      -- Créer ce groupe
      INSERT INTO public.leagues(division, week_start, week_end, group_index)
      VALUES (v_division, v_week_start, v_week_end, v_group)
      RETURNING id INTO v_league_id;
      EXIT;
    ELSIF v_count < 30 THEN
      EXIT; -- groupe trouvé
    ELSE
      v_group := v_group + 1; -- essayer le groupe suivant
    END IF;
  END LOOP;

  -- Inscrire l'utilisateur
  INSERT INTO public.league_participants(league_id, user_id)
  VALUES (v_league_id, p_user_id)
  ON CONFLICT (league_id, user_id) DO NOTHING;

END;
$$;

-- ────────────────────────────────────────────────────────────
-- 6. FONCTION process_league_week
-- À appeler chaque lundi matin (cron) pour :
--   - calculer les rangs finaux de la semaine précédente
--   - promouvoir / rétrograder les utilisateurs
-- ────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.process_league_week(date);
CREATE OR REPLACE FUNCTION public.process_league_week(p_week_start date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT l.id AS league_id, l.division, COUNT(lp.id) AS total
    FROM public.leagues l
    JOIN public.league_participants lp ON lp.league_id = l.id
    WHERE l.week_start = p_week_start
    GROUP BY l.id, l.division
  LOOP
    -- Calculer les rangs par XP décroissant
    UPDATE public.league_participants lp
    SET rank = sub.rk
    FROM (
      SELECT id,
             ROW_NUMBER() OVER (ORDER BY xp_gained DESC) AS rk
      FROM public.league_participants
      WHERE league_id = r.league_id
    ) sub
    WHERE lp.id = sub.id;

    -- Top 5 → promus (sauf Élite)
    UPDATE public.league_participants lp
    SET promoted = true
    WHERE league_id = r.league_id
      AND rank <= 5
      AND r.division <> 'Élite';

    -- Bottom 5 → rétrogradés (si >= 10 participants, sauf Bronze)
    IF r.total >= 10 THEN
      UPDATE public.league_participants lp
      SET relegated = true
      WHERE league_id = r.league_id
        AND rank > r.total - 5
        AND r.division <> 'Bronze';
    END IF;

    -- Appliquer les changements de division sur les profils
    UPDATE public.profiles p
    SET league_division = CASE
      WHEN lp.promoted THEN
        CASE r.division
          WHEN 'Bronze'  THEN 'Argent'
          WHEN 'Argent'  THEN 'Or'
          WHEN 'Or'      THEN 'Diamant'
          WHEN 'Diamant' THEN 'Élite'
          ELSE r.division
        END
      WHEN lp.relegated THEN
        CASE r.division
          WHEN 'Élite'   THEN 'Diamant'
          WHEN 'Diamant' THEN 'Or'
          WHEN 'Or'      THEN 'Argent'
          WHEN 'Argent'  THEN 'Bronze'
          ELSE r.division
        END
      ELSE r.division
    END
    FROM public.league_participants lp
    WHERE lp.league_id = r.league_id
      AND p.id = lp.user_id;
  END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 7. TRIGGER : incrémenter xp_gained dans league_participants
-- Dès qu'un xp_event est inséré, MAJ le participant de la ligue courante
-- ────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.trg_xp_event_to_league();
CREATE OR REPLACE FUNCTION public.trg_xp_event_to_league()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_week_start  date;
  v_league_id   uuid;
BEGIN
  v_week_start := date_trunc('week', now())::date;

  SELECT l.id INTO v_league_id
  FROM public.league_participants lp
  JOIN public.leagues l ON l.id = lp.league_id
  WHERE lp.user_id = NEW.user_id
    AND l.week_start = v_week_start
  LIMIT 1;

  IF v_league_id IS NOT NULL THEN
    UPDATE public.league_participants
    SET xp_gained = xp_gained + NEW.xp
    WHERE league_id = v_league_id AND user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_xp_event_to_league ON public.xp_events;
CREATE TRIGGER trg_xp_event_to_league
  AFTER INSERT ON public.xp_events
  FOR EACH ROW EXECUTE FUNCTION public.trg_xp_event_to_league();

-- ────────────────────────────────────────────────────────────
-- 8. COLONNES LESSONS : examen final
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS is_final_exam        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS exam_duration_minutes integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS exam_passing_score    integer DEFAULT 80,
  ADD COLUMN IF NOT EXISTS exam_max_attempts     integer DEFAULT 3;

-- ────────────────────────────────────────────────────────────
-- 9. TABLE final_exam_attempts
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.final_exam_attempts (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id          uuid        NOT NULL REFERENCES public.courses(id)  ON DELETE CASCADE,
  lesson_id          uuid        NOT NULL REFERENCES public.lessons(id)  ON DELETE CASCADE,
  answers            jsonb       NOT NULL DEFAULT '[]',
  score              integer     NOT NULL,
  passed             boolean     NOT NULL DEFAULT false,
  time_used_seconds  integer,
  attempt_number     integer     NOT NULL DEFAULT 1,
  submitted_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS final_exam_attempts_user_course_idx
  ON public.final_exam_attempts(user_id, course_id);

ALTER TABLE public.final_exam_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exam_attempts_select_own" ON public.final_exam_attempts;
DROP POLICY IF EXISTS "exam_attempts_insert_own" ON public.final_exam_attempts;
CREATE POLICY "exam_attempts_select_own" ON public.final_exam_attempts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "exam_attempts_insert_own" ON public.final_exam_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 10. FONCTION exam_attempts_left
-- ────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.exam_attempts_left(uuid,uuid);
CREATE OR REPLACE FUNCTION public.exam_attempts_left(
  p_user_id   uuid,
  p_lesson_id uuid
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT GREATEST(0,
    COALESCE((SELECT exam_max_attempts FROM public.lessons WHERE id = p_lesson_id), 3)
    - (SELECT COUNT(*) FROM public.final_exam_attempts
       WHERE user_id = p_user_id AND lesson_id = p_lesson_id)
  );
$$;

-- ────────────────────────────────────────────────────────────
-- 11. CRON : géré par Vercel (vercel.json) via /api/leagues/process-week
--     Le cron pg_cron n'est pas nécessaire ici.
-- ────────────────────────────────────────────────────────────

-- ────────────────────────────────────────────────────────────
-- FIN migration 020
-- ────────────────────────────────────────────────────────────
