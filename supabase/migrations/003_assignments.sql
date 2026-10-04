-- ============================================================
-- Migration 003 : Système de devoirs (Assignments)
-- ============================================================

-- Table principale des devoirs
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  instructions text NOT NULL,
  submission_type text NOT NULL DEFAULT 'file' CHECK (submission_type IN ('file', 'text', 'both')),
  max_score integer NOT NULL DEFAULT 100,
  passing_score integer NOT NULL DEFAULT 60,
  deadline_hours integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecture assignments inscrits" ON public.assignments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.enrollments e WHERE e.course_id = assignments.course_id AND e.user_id = auth.uid() AND e.status = 'active')
    OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id = assignments.course_id AND c.instructor_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','coordinateur'))
  );
CREATE POLICY "Formateur gère assignments" ON public.assignments FOR ALL
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = auth.uid()));

-- Table des soumissions d'apprenants
CREATE TABLE public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  text_content text,
  file_url text,
  file_name text,
  file_size_bytes integer,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','reviewing','graded','rejected')),
  score integer,
  feedback text,
  graded_by uuid REFERENCES public.profiles(id),
  graded_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, user_id)
);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Apprenant voit ses soumissions" ON public.assignment_submissions
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','coordinateur'))
  );
CREATE POLICY "Apprenant soumet son devoir" ON public.assignment_submissions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Apprenant modifie si non noté" ON public.assignment_submissions
  FOR UPDATE USING (
    (user_id = auth.uid() AND status = 'submitted')
    OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = auth.uid())
  );

-- Index performance
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_user ON public.assignment_submissions (user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status ON public.assignment_submissions (assignment_id, status);
