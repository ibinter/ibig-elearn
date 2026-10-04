-- ============================================================
-- Migration 007 : Examen final minuté
-- ============================================================

-- 1. Ajouter 'final_exam' au type de leçon
ALTER TABLE public.lessons
  DROP CONSTRAINT IF EXISTS lessons_type_check;

ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_type_check
    CHECK (type IN ('video','document','quiz','assignment','final_exam'));

-- 2. Colonnes spécifiques à l'examen final sur lessons
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS exam_duration_minutes  integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS exam_passing_score     integer NOT NULL DEFAULT 80,
  ADD COLUMN IF NOT EXISTS exam_max_attempts      integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS quiz_passing_score     integer NOT NULL DEFAULT 70;

-- 3. Table des tentatives d'examen final
CREATE TABLE IF NOT EXISTS public.final_exam_attempts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id     uuid        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id     uuid        NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  answers       jsonb       NOT NULL DEFAULT '[]',   -- [{question_id, selected_option}]
  score         integer     NOT NULL DEFAULT 0,       -- % de bonnes réponses
  passed        boolean     NOT NULL DEFAULT false,
  time_used_seconds integer,                          -- temps utilisé en secondes
  started_at    timestamptz NOT NULL DEFAULT now(),
  submitted_at  timestamptz,
  attempt_number integer    NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_final_exam_user_course
  ON public.final_exam_attempts (user_id, course_id, submitted_at DESC);

ALTER TABLE public.final_exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture propre exam" ON public.final_exam_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Insert propre exam" ON public.final_exam_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Formateurs et admins peuvent lire les tentatives de leurs cours
CREATE POLICY "Formateur lit exams cours" ON public.final_exam_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.instructor_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','coordinateur')
    )
  );

-- 4. Fonction : vérifie si l'examen final est disponible (toutes leçons non-exam complétées)
CREATE OR REPLACE FUNCTION public.is_final_exam_available(
  p_user_id   uuid,
  p_course_id uuid,
  p_lesson_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_total    integer;
  v_done     integer;
BEGIN
  -- Toutes les leçons du cours SAUF l'examen final lui-même
  SELECT COUNT(*) INTO v_total
  FROM public.lessons
  WHERE course_id = p_course_id
    AND id <> p_lesson_id
    AND type <> 'final_exam';

  SELECT COUNT(*) INTO v_done
  FROM public.lesson_progress lp
  JOIN public.lessons l ON l.id = lp.lesson_id
  WHERE lp.user_id = p_user_id
    AND lp.course_id = p_course_id
    AND lp.is_completed = true
    AND l.type <> 'final_exam'
    AND l.id <> p_lesson_id;

  RETURN v_total > 0 AND v_done >= v_total;
END;
$$;

-- 5. Fonction : nombre de tentatives restantes
CREATE OR REPLACE FUNCTION public.exam_attempts_left(
  p_user_id   uuid,
  p_lesson_id uuid
)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_max_attempts  integer;
  v_used          integer;
BEGIN
  SELECT exam_max_attempts INTO v_max_attempts
  FROM public.lessons WHERE id = p_lesson_id;

  SELECT COUNT(*) INTO v_used
  FROM public.final_exam_attempts
  WHERE user_id = p_user_id AND lesson_id = p_lesson_id
    AND submitted_at IS NOT NULL;

  RETURN GREATEST(0, COALESCE(v_max_attempts, 3) - v_used);
END;
$$;
