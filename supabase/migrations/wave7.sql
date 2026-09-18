-- Wave 7: reviews (si pas encore créée) + wishlists

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS reviews_course_id_idx ON reviews(course_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='anyone can read reviews') THEN
    CREATE POLICY "anyone can read reviews" ON reviews FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='enrolled users can insert review') THEN
    CREATE POLICY "enrolled users can insert review" ON reviews FOR INSERT
      WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM enrollments WHERE user_id = auth.uid() AND course_id = reviews.course_id)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='users can update own review') THEN
    CREATE POLICY "users can update own review" ON reviews FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS wishlists_user_id_idx ON wishlists(user_id);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wishlists' AND policyname='users manage own wishlist') THEN
    CREATE POLICY "users manage own wishlist" ON wishlists
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Colonnes rating_avg + review_count sur courses (si pas encore là)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2) DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Fonction pour recalculer les stats d'avis d'une formation
CREATE OR REPLACE FUNCTION update_course_rating(p_course_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE courses
  SET
    rating_avg = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE course_id = p_course_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE course_id = p_course_id)
  WHERE id = p_course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger auto-update rating
CREATE OR REPLACE FUNCTION trigger_update_course_rating()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_course_rating(COALESCE(NEW.course_id, OLD.course_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reviews_update_rating ON reviews;
CREATE TRIGGER reviews_update_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_update_course_rating();
