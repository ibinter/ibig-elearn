-- ═══════════════════════════════════════════════════════
-- BATCH 1 — Confiance & Engagement
-- Notes & avis, Recherche, Gamification
-- ═══════════════════════════════════════════════════════

-- ── 1. TABLE REVIEWS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id     UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reviews_delete" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- Mettre à jour rating_avg et review_count sur courses
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS rating_avg  NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Fonction pour recalculer les stats de rating
CREATE OR REPLACE FUNCTION update_course_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courses SET
    rating_avg   = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)),
    review_count = (SELECT COUNT(*) FROM reviews WHERE course_id = COALESCE(NEW.course_id, OLD.course_id))
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_course_rating ON reviews;
CREATE TRIGGER trg_update_course_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_course_rating();

-- ── 2. RECHERCHE FULL-TEXT ────────────────────────────
-- Index de recherche sur courses
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

UPDATE courses SET search_vector =
  to_tsvector('french',
    COALESCE(title, '') || ' ' ||
    COALESCE(short_description, '') || ' ' ||
    COALESCE(description, '')
  );

CREATE INDEX IF NOT EXISTS idx_courses_search ON courses USING GIN(search_vector);

-- Trigger pour maintenir search_vector à jour
CREATE OR REPLACE FUNCTION update_course_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('french',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.short_description, '') || ' ' ||
    COALESCE(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_courses_search ON courses;
CREATE TRIGGER trg_courses_search
  BEFORE INSERT OR UPDATE OF title, short_description, description ON courses
  FOR EACH ROW EXECUTE FUNCTION update_course_search_vector();

-- ── 3. GAMIFICATION ──────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS total_points      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_days       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_date DATE,
  ADD COLUMN IF NOT EXISTS level             TEXT DEFAULT 'débutant';

-- Trigger automatique sur lesson_progress
CREATE OR REPLACE FUNCTION trg_award_points_on_lesson()
RETURNS TRIGGER AS $$
BEGIN
  -- Seulement quand is_completed passe à true pour la première fois
  IF NEW.is_completed = true AND (OLD IS NULL OR OLD.is_completed = false) THEN
    PERFORM award_lesson_points(NEW.user_id, NEW.course_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_lesson_complete_points ON lesson_progress;
CREATE TRIGGER trg_lesson_complete_points
  AFTER INSERT OR UPDATE ON lesson_progress
  FOR EACH ROW EXECUTE FUNCTION trg_award_points_on_lesson();

-- Fonction appelée à chaque leçon complétée
CREATE OR REPLACE FUNCTION award_lesson_points(p_user_id UUID, p_course_id UUID)
RETURNS VOID AS $$
DECLARE
  today DATE := CURRENT_DATE;
  last_date DATE;
  new_streak INTEGER;
  new_points INTEGER;
BEGIN
  SELECT last_activity_date, streak_days INTO last_date, new_streak
  FROM profiles WHERE id = p_user_id;

  -- Calcul streak
  IF last_date = today - 1 THEN
    new_streak := new_streak + 1;
  ELSIF last_date = today THEN
    -- Déjà actif aujourd'hui, pas de changement
    NULL;
  ELSE
    new_streak := 1;
  END IF;

  -- Points : 10 par leçon + bonus streak
  new_points := 10 + LEAST(new_streak, 7) * 2;

  UPDATE profiles SET
    total_points      = total_points + new_points,
    streak_days       = new_streak,
    last_activity_date = today,
    level = CASE
      WHEN total_points + new_points >= 5000 THEN 'expert'
      WHEN total_points + new_points >= 2000 THEN 'avancé'
      WHEN total_points + new_points >= 500  THEN 'intermédiaire'
      ELSE 'débutant'
    END
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
