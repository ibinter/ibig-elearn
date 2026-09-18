-- ═══════════════════════════════════════════════════════
-- FORUM DE DISCUSSION PAR LEÇON
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS discussions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id   UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES discussions(id) ON DELETE CASCADE, -- null = post racine
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  likes_count INTEGER NOT NULL DEFAULT 0,
  is_pinned   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discussions_lesson  ON discussions(lesson_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_parent  ON discussions(parent_id);
CREATE INDEX IF NOT EXISTS idx_discussions_user    ON discussions(user_id);

ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "disc_select" ON discussions FOR SELECT USING (true);
CREATE POLICY "disc_insert" ON discussions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "disc_update" ON discussions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "disc_delete" ON discussions FOR DELETE USING (auth.uid() = user_id);

-- Table des likes (évite les doublons)
CREATE TABLE IF NOT EXISTS discussion_likes (
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, discussion_id)
);

ALTER TABLE discussion_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dlikes_select" ON discussion_likes FOR SELECT USING (true);
CREATE POLICY "dlikes_insert" ON discussion_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dlikes_delete" ON discussion_likes FOR DELETE USING (auth.uid() = user_id);

-- Trigger pour mettre à jour likes_count
CREATE OR REPLACE FUNCTION update_discussion_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE discussions SET likes_count = likes_count + 1 WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE discussions SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.discussion_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_discussion_likes ON discussion_likes;
CREATE TRIGGER trg_discussion_likes
  AFTER INSERT OR DELETE ON discussion_likes
  FOR EACH ROW EXECUTE FUNCTION update_discussion_likes_count();
