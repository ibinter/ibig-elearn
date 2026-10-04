-- ============================================================
-- Migration 017 : job_title + fonction recommandations
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS job_title text;

-- Fonction : recommander des cours selon le profil apprenant
CREATE OR REPLACE FUNCTION public.get_recommended_courses(
  p_user_id uuid,
  p_limit   int DEFAULT 6
)
RETURNS TABLE (
  id               uuid,
  title            text,
  slug             text,
  short_description text,
  thumbnail_url    text,
  price_xof        integer,
  level            text,
  rating_average   numeric,
  enrollment_count integer,
  instructor_name  text,
  score            int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_interests        text[];
  v_level            text;
  v_already_enrolled uuid[];
BEGIN
  -- Récupérer le profil
  SELECT
    COALESCE(pr.interests, '{}'),
    pr.preferred_level
  INTO v_interests, v_level
  FROM public.profiles pr
  WHERE pr.id = p_user_id;

  -- Cours déjà inscrits
  SELECT ARRAY_AGG(e.course_id) INTO v_already_enrolled
  FROM public.enrollments e WHERE e.user_id = p_user_id;

  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.slug,
    c.short_description,
    c.thumbnail_url,
    c.price_xof,
    c.level,
    c.rating_average,
    c.enrollment_count,
    p.full_name AS instructor_name,
    (
      -- Score : catégorie dans les intérêts (+40), niveau correspondant (+20),
      -- popularité (+0-20), note (+0-20)
      CASE WHEN c.category_id::text = ANY(v_interests) THEN 40 ELSE 0 END +
      CASE WHEN v_level IS NULL OR c.level = v_level THEN 20 ELSE 0 END +
      LEAST(20, (c.enrollment_count / 10)) +
      LEAST(20, ROUND(COALESCE(c.rating_average, 0) * 4)::int)
    ) AS score
  FROM public.courses c
  LEFT JOIN public.profiles p ON p.id = c.instructor_id
  WHERE c.is_published = true
    AND (v_already_enrolled IS NULL OR c.id != ALL(v_already_enrolled))
  ORDER BY score DESC, c.enrollment_count DESC
  LIMIT p_limit;
END;
$$;
