-- Badges de compétences
CREATE TABLE IF NOT EXISTS badges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  icon          TEXT NOT NULL DEFAULT '🏆',
  color         TEXT NOT NULL DEFAULT '#0B3D91',
  criteria_type TEXT NOT NULL CHECK (criteria_type IN ('course_completion','quiz_score','enrollment_count','manual')),
  criteria_value JSONB DEFAULT '{}',
  course_id     UUID REFERENCES courses(id) ON DELETE CASCADE,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_select" ON badges FOR SELECT USING (true);
CREATE POLICY "badges_admin_all" ON badges FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE TABLE IF NOT EXISTS user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id   UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_badges_select" ON user_badges FOR SELECT USING (true);
CREATE POLICY "user_badges_insert_admin" ON user_badges FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "user_badges_delete_admin" ON user_badges FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Badges par défaut
INSERT INTO badges (name, description, icon, color, criteria_type, criteria_value) VALUES
  ('Première formation', 'A complété sa première formation', '🎓', '#0B3D91', 'enrollment_count', '{"count":1}'),
  ('Apprenant assidu', 'A complété 3 formations', '📚', '#059669', 'enrollment_count', '{"count":3}'),
  ('Expert certifié', 'A complété 5 formations', '⭐', '#FFA500', 'enrollment_count', '{"count":5}'),
  ('Quiz ace', 'A obtenu 100% à un quiz', '💯', '#7C3AED', 'quiz_score', '{"min_score":100}'),
  ('Pioneer', 'Badge décerné manuellement par l''administration', '🌍', '#DC2626', 'manual', '{}')
ON CONFLICT DO NOTHING;
