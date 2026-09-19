-- Wave 17: Critical missing features

-- 1. Q&A par leçon
CREATE TABLE IF NOT EXISTS lesson_qa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  answered_by UUID REFERENCES profiles(id),
  answered_at TIMESTAMPTZ,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qa_upvotes (
  qa_id UUID REFERENCES lesson_qa(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (qa_id, user_id)
);

ALTER TABLE lesson_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lesson_qa_read" ON lesson_qa FOR SELECT USING (true);
CREATE POLICY "lesson_qa_insert" ON lesson_qa FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lesson_qa_answer" ON lesson_qa FOR UPDATE USING (
  auth.uid() = answered_by OR
  auth.uid() IN (SELECT instructor_id FROM courses WHERE id = course_id)
);
CREATE POLICY "qa_upvotes_all" ON qa_upvotes FOR ALL USING (auth.uid() = user_id);

-- 2. Workflow approbation cours
ALTER TABLE courses ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'draft'; -- draft, pending, approved, rejected
ALTER TABLE courses ADD COLUMN IF NOT EXISTS approval_note TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- 3. Demandes de virement
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount BIGINT NOT NULL,
  method TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, paid, rejected
  admin_note TEXT,
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payout_own" ON payout_requests FOR SELECT USING (auth.uid() = instructor_id);
CREATE POLICY "payout_insert" ON payout_requests FOR INSERT WITH CHECK (auth.uid() = instructor_id);
CREATE POLICY "payout_admin" ON payout_requests FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Solde formateur
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payout_balance_xof BIGINT DEFAULT 0;

-- 4. Coupons formateur (ajout instructor_id à la table existante)
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES profiles(id);

-- 5. Messagerie de masse formateur
CREATE TABLE IF NOT EXISTS bulk_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  recipients_count INT DEFAULT 0,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bulk_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bulk_messages_own" ON bulk_messages FOR SELECT USING (auth.uid() = instructor_id);
CREATE POLICY "bulk_messages_insert" ON bulk_messages FOR INSERT WITH CHECK (auth.uid() = instructor_id);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_lesson_qa_lesson ON lesson_qa(lesson_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_instructor ON payout_requests(instructor_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_bulk_messages_instructor ON bulk_messages(instructor_id);
