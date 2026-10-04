-- ============================================================
-- Migration 013 : Certificats avec vérification QR
-- ============================================================

-- Nettoyage d'une éventuelle tentative partielle précédente
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP TRIGGER IF EXISTS trg_auto_certificate ON public.enrollments;

-- 1. Table des certificats
CREATE TABLE public.certificates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id         uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_id     uuid REFERENCES public.enrollments(id) ON DELETE SET NULL,
  certificate_number text NOT NULL UNIQUE,  -- ex: IBIG-2026-ABC123
  issued_at         timestamptz NOT NULL DEFAULT now(),
  expires_at        timestamptz,            -- null = pas d'expiration
  final_score       numeric(5,2),           -- score final en %
  completion_time_h numeric(6,1),           -- heures de formation
  instructor_name   text,                   -- snapshot au moment de l'émission
  course_title      text NOT NULL,          -- snapshot
  learner_name      text NOT NULL,          -- snapshot
  is_revoked        boolean NOT NULL DEFAULT false,
  revoked_at        timestamptz,
  revoke_reason     text,
  metadata          jsonb DEFAULT '{}',
  UNIQUE (user_id, course_id)
);

-- 2. Index
CREATE INDEX idx_certificates_user   ON public.certificates (user_id);
CREATE INDEX idx_certificates_course ON public.certificates (course_id);
CREATE INDEX idx_certificates_number ON public.certificates (certificate_number);

-- 3. RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cert_select_own" ON public.certificates
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','formateur'))
  );

CREATE POLICY "cert_insert_service" ON public.certificates
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','formateur'))
    OR user_id = auth.uid()
  );

-- 4. Fonction : émettre un certificat (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.issue_certificate(p_user_id uuid, p_course_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment    record;
  v_profile       record;
  v_course        record;
  v_cert_number   text;
  v_cert_id       uuid;
  v_final_score   numeric;
  v_hours         numeric;
BEGIN
  -- Vérifier l'inscription complète
  SELECT * INTO v_enrollment
  FROM public.enrollments
  WHERE user_id = p_user_id AND course_id = p_course_id AND completed_at IS NOT NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Formation non terminée pour cet apprenant';
  END IF;

  -- Éviter les doublons
  IF EXISTS (SELECT 1 FROM public.certificates WHERE user_id = p_user_id AND course_id = p_course_id) THEN
    SELECT id INTO v_cert_id FROM public.certificates WHERE user_id = p_user_id AND course_id = p_course_id;
    RETURN v_cert_id;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  SELECT c.*, p.full_name AS instructor_full_name
  INTO v_course
  FROM public.courses c
  LEFT JOIN public.profiles p ON p.id = c.instructor_id
  WHERE c.id = p_course_id;

  -- Score final = moyenne des quiz passés
  SELECT AVG(score) INTO v_final_score
  FROM public.quiz_attempts
  WHERE user_id = p_user_id AND course_id = p_course_id;

  -- Durée totale (somme des durées de leçons vues)
  SELECT COALESCE(SUM(m.duration_minutes) / 60.0, 0) INTO v_hours
  FROM public.lesson_progress lp
  JOIN public.modules m ON m.id = lp.lesson_id
  WHERE lp.user_id = p_user_id AND lp.completed = true
    AND EXISTS (
      SELECT 1 FROM public.modules ms
      WHERE ms.id = m.id AND ms.course_id = p_course_id
    );

  -- Numéro unique : IBIG-YYYY-XXXXXX
  v_cert_number := 'IBIG-' || TO_CHAR(now(), 'YYYY') || '-' ||
                   UPPER(SUBSTRING(MD5(p_user_id::text || p_course_id::text || now()::text) FROM 1 FOR 6));

  INSERT INTO public.certificates (
    user_id, course_id, enrollment_id,
    certificate_number, final_score, completion_time_h,
    instructor_name, course_title, learner_name
  ) VALUES (
    p_user_id, p_course_id, v_enrollment.id,
    v_cert_number, v_final_score, v_hours,
    v_course.instructor_full_name, v_course.title, v_profile.full_name
  )
  RETURNING id INTO v_cert_id;

  RETURN v_cert_id;
END;
$$;

-- 5. Déclencher automatiquement l'émission quand enrollment.completed_at est mis à jour
CREATE OR REPLACE FUNCTION public.auto_issue_certificate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    PERFORM public.issue_certificate(NEW.user_id, NEW.course_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_certificate ON public.enrollments;
CREATE TRIGGER trg_auto_certificate
  AFTER UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.auto_issue_certificate();
