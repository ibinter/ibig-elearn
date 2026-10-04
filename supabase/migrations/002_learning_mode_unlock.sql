-- ============================================================
-- Migration 002 : Mode d'apprentissage + déblocage séquentiel
-- ============================================================

-- 1. Ajouter le mode d'apprentissage aux inscriptions
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'autonome'
  CHECK (mode IN ('autonome', 'guide', 'certifiant'));

-- 2. Fonction helper : vérifier si un module est débloqué pour un utilisateur
-- Logique :
--   - Module 0 (premier) : toujours débloqué
--   - Mode autonome : tout débloqué
--   - Mode guide/certifiant : le module précédent doit avoir son quiz passé à ≥70%
--     ou, si pas de quiz dans le module précédent, toutes ses leçons doivent être complétées
CREATE OR REPLACE FUNCTION public.is_module_unlocked(
  p_user_id uuid,
  p_module_id uuid,
  p_course_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mode         text;
  v_position     integer;
  v_prev_module  uuid;
  v_quiz_lesson  uuid;
  v_passed       boolean;
  v_all_done     boolean;
BEGIN
  -- Récupérer le mode d'inscription
  SELECT mode INTO v_mode
  FROM public.enrollments
  WHERE user_id = p_user_id AND course_id = p_course_id;

  -- Mode autonome : tout débloqué
  IF v_mode IS NULL OR v_mode = 'autonome' THEN
    RETURN true;
  END IF;

  -- Récupérer la position du module courant
  SELECT position INTO v_position
  FROM public.modules
  WHERE id = p_module_id;

  -- Premier module : toujours débloqué
  IF v_position = 0 OR v_position IS NULL THEN
    RETURN true;
  END IF;

  -- Trouver le module précédent (position - 1)
  SELECT id INTO v_prev_module
  FROM public.modules
  WHERE course_id = p_course_id AND position = v_position - 1;

  IF v_prev_module IS NULL THEN
    RETURN true;
  END IF;

  -- Chercher une leçon quiz dans le module précédent
  SELECT id INTO v_quiz_lesson
  FROM public.lessons
  WHERE module_id = v_prev_module AND type = 'quiz'
  ORDER BY position DESC
  LIMIT 1;

  IF v_quiz_lesson IS NOT NULL THEN
    -- Vérifier si le quiz a été passé avec ≥70%
    SELECT EXISTS(
      SELECT 1 FROM public.quiz_attempts
      WHERE user_id = p_user_id
        AND lesson_id = v_quiz_lesson
        AND score >= 70
    ) INTO v_passed;
    RETURN v_passed;
  ELSE
    -- Pas de quiz : vérifier que toutes les leçons du module précédent sont complétées
    SELECT NOT EXISTS(
      SELECT 1 FROM public.lessons l
      WHERE l.module_id = v_prev_module
        AND NOT EXISTS(
          SELECT 1 FROM public.lesson_progress lp
          WHERE lp.lesson_id = l.id
            AND lp.user_id = p_user_id
            AND lp.is_completed = true
        )
    ) INTO v_all_done;
    RETURN v_all_done;
  END IF;
END;
$$;

-- 3. Index pour accélérer les requêtes d'unlock
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_lesson
  ON public.quiz_attempts (user_id, lesson_id, score);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_completed
  ON public.lesson_progress (user_id, course_id, is_completed);

CREATE INDEX IF NOT EXISTS idx_modules_course_position
  ON public.modules (course_id, position);
