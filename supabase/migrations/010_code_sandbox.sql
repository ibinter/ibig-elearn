-- ============================================================
-- Migration 010 : Code Sandbox (leçons techniques interactives)
-- ============================================================

-- 1. Ajouter 'code' comme type de leçon
ALTER TABLE public.lessons
  DROP CONSTRAINT IF EXISTS lessons_type_check;

ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_type_check
  CHECK (type IN ('video','document','quiz','assignment','final_exam','audio','code'));

-- 2. Colonnes spécifiques aux leçons code
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS code_language     text,         -- 'python', 'javascript', 'typescript', 'java', 'c', 'cpp', 'bash', etc.
  ADD COLUMN IF NOT EXISTS code_starter      text,         -- Code de départ fourni à l'apprenant
  ADD COLUMN IF NOT EXISTS code_solution     text,         -- Solution (visible uniquement après tentatives ou correction)
  ADD COLUMN IF NOT EXISTS code_tests        jsonb,        -- [{ "input": "...", "expected": "...", "label": "..." }]
  ADD COLUMN IF NOT EXISTS code_instructions text;         -- Instructions Markdown affichées à gauche

-- 3. Table des soumissions de code
CREATE TABLE IF NOT EXISTS public.code_submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id       uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id       uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  language        text NOT NULL,
  code            text NOT NULL,
  status          text NOT NULL CHECK (status IN ('pending','running','passed','failed','error')) DEFAULT 'pending',
  passed_tests    integer NOT NULL DEFAULT 0,
  total_tests     integer NOT NULL DEFAULT 0,
  output          text,
  error_message   text,
  execution_ms    integer,
  attempt_number  integer NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_code_submissions_user_lesson
  ON public.code_submissions (user_id, lesson_id, created_at DESC);

-- RLS
ALTER TABLE public.code_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "code_submissions_own" ON public.code_submissions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "code_submissions_formateur_select" ON public.code_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.instructor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
