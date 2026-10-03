-- Option C : Cohortes entreprise + bon de commande + facturation groupée

-- Cohortes : un groupe d'employés inscrits à une formation
CREATE TABLE IF NOT EXISTS b2b_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  b2b_request_id UUID REFERENCES b2b_requests(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_per_learner NUMERIC(10,2),
  currency TEXT DEFAULT 'XOF',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'active', 'completed', 'cancelled')),
  start_date DATE,
  end_date DATE,
  bon_de_commande_number TEXT UNIQUE,
  facture_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membres d'une cohorte
CREATE TABLE IF NOT EXISTS b2b_cohort_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES b2b_cohorts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'enrolled', 'completed', 'cancelled')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  enrolled_at TIMESTAMPTZ,
  UNIQUE(cohort_id, email)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_b2b_cohorts_request ON b2b_cohorts(b2b_request_id);
CREATE INDEX IF NOT EXISTS idx_b2b_cohort_members_cohort ON b2b_cohort_members(cohort_id);
CREATE INDEX IF NOT EXISTS idx_b2b_cohort_members_user ON b2b_cohort_members(user_id);

-- RLS
ALTER TABLE b2b_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_cohort_members ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "admin_all_cohorts" ON b2b_cohorts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_all_cohort_members" ON b2b_cohort_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can view their own membership
CREATE POLICY "user_own_cohort_member" ON b2b_cohort_members
  FOR SELECT USING (user_id = auth.uid());
