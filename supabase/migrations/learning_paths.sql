-- Learning Paths (Parcours de formation)
CREATE TABLE IF NOT EXISTS learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  short_description text,
  thumbnail_url text,
  level text DEFAULT 'tous_niveaux',
  estimated_hours int DEFAULT 0,
  is_published boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_path_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid REFERENCES learning_paths(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  position int DEFAULT 0,
  is_required boolean DEFAULT true,
  UNIQUE(path_id, course_id)
);

CREATE TABLE IF NOT EXISTS learning_path_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid REFERENCES learning_paths(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(path_id, user_id)
);

-- RLS
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learning_paths_public_read" ON learning_paths FOR SELECT USING (is_published = true);
CREATE POLICY "learning_paths_admin_all" ON learning_paths FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinateur'))
);

CREATE POLICY "lp_courses_read" ON learning_path_courses FOR SELECT USING (
  EXISTS (SELECT 1 FROM learning_paths WHERE id = path_id AND is_published = true)
);
CREATE POLICY "lp_courses_admin" ON learning_path_courses FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinateur'))
);

CREATE POLICY "lp_enrollments_own" ON learning_path_enrollments FOR ALL USING (user_id = auth.uid());
CREATE POLICY "lp_enrollments_admin" ON learning_path_enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinateur'))
);
