-- RLS : formateurs peuvent gérer leurs propres modules et leçons

-- MODULES
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modules_select_enrolled" ON public.modules;
DROP POLICY IF EXISTS "modules_select_all" ON public.modules;
DROP POLICY IF EXISTS "modules_insert_formateur" ON public.modules;
DROP POLICY IF EXISTS "modules_update_formateur" ON public.modules;
DROP POLICY IF EXISTS "modules_delete_formateur" ON public.modules;

-- Lecture : tout le monde peut lire les modules des cours publiés
CREATE POLICY "modules_select_all" ON public.modules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND is_published = true)
    OR
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid())
  );

-- Insert : le formateur propriétaire du cours peut ajouter des modules
CREATE POLICY "modules_insert_formateur" ON public.modules
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid())
  );

-- Update : le formateur propriétaire peut modifier ses modules
CREATE POLICY "modules_update_formateur" ON public.modules
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid())
  );

-- Delete : le formateur propriétaire peut supprimer ses modules
CREATE POLICY "modules_delete_formateur" ON public.modules
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid())
  );

-- LESSONS
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lessons_select_all" ON public.lessons;
DROP POLICY IF EXISTS "lessons_insert_formateur" ON public.lessons;
DROP POLICY IF EXISTS "lessons_update_formateur" ON public.lessons;
DROP POLICY IF EXISTS "lessons_delete_formateur" ON public.lessons;

-- Lecture : cours publié ou propriétaire
CREATE POLICY "lessons_select_all" ON public.lessons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND is_published = true)
    OR
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.enrollments WHERE course_id = lessons.course_id AND user_id = auth.uid())
  );

-- Insert
CREATE POLICY "lessons_insert_formateur" ON public.lessons
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid())
  );

-- Update
CREATE POLICY "lessons_update_formateur" ON public.lessons
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid())
  );

-- Delete
CREATE POLICY "lessons_delete_formateur" ON public.lessons
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid())
  );
