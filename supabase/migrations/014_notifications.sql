-- ============================================================
-- Migration 014 : Notifications in-app + triggers automatiques
-- ============================================================

DROP TABLE IF EXISTS public.notifications CASCADE;

CREATE TABLE public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        text NOT NULL DEFAULT 'system'
              CHECK (type IN ('enrollment','certificate','message','live','achievement','league','xp','system')),
  title       text NOT NULL,
  body        text,
  link        text,
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifs_user ON public.notifications (user_id, created_at DESC);
CREATE INDEX idx_notifs_unread ON public.notifications (user_id, is_read) WHERE is_read = false;

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifs_own" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================
-- Fonction utilitaire : créer une notification
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type    text,
  p_title   text,
  p_body    text DEFAULT NULL,
  p_link    text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (p_user_id, p_type, p_title, p_body, p_link);
END;
$$;

-- ============================================================
-- Trigger : certificat émis
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_certificate_issued()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.create_notification(
    NEW.user_id,
    'certificate',
    '🎓 Certificat obtenu !',
    'Félicitations ! Vous avez obtenu votre certificat pour "' || NEW.course_title || '".',
    '/certificats'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_certificate ON public.certificates;
CREATE TRIGGER trg_notify_certificate
  AFTER INSERT ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.notify_certificate_issued();

-- ============================================================
-- Trigger : inscription à un cours
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_enrollment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_title text;
BEGIN
  SELECT title INTO v_course_title FROM public.courses WHERE id = NEW.course_id;
  PERFORM public.create_notification(
    NEW.user_id,
    'enrollment',
    '📚 Inscription confirmée',
    'Vous êtes maintenant inscrit à "' || COALESCE(v_course_title, 'la formation') || '".',
    '/apprendre/' || NEW.course_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_enrollment ON public.enrollments;
CREATE TRIGGER trg_notify_enrollment
  AFTER INSERT ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.notify_enrollment();

-- ============================================================
-- Trigger : session live programmée (notif aux inscrits du cours)
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_live_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notifier tous les apprenants inscrits au cours associé
  IF NEW.course_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    SELECT
      e.user_id,
      'live',
      '🎥 Session live programmée',
      '"' || NEW.title || '" le ' || TO_CHAR(NEW.scheduled_at AT TIME ZONE 'UTC', 'DD/MM/YYYY à HH24:MI') || ' UTC',
      '/sessions-live/' || NEW.id
    FROM public.enrollments e
    WHERE e.course_id = NEW.course_id
      AND e.user_id != NEW.instructor_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_live_session ON public.live_sessions;
CREATE TRIGGER trg_notify_live_session
  AFTER INSERT ON public.live_sessions
  FOR EACH ROW EXECUTE FUNCTION public.notify_live_session();

-- ============================================================
-- Trigger : badge / achievement XP (paliers)
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_xp_milestone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  milestones int[] := ARRAY[100, 500, 1000, 2500, 5000, 10000];
  m int;
BEGIN
  IF NEW.xp_points IS NULL OR OLD.xp_points IS NULL THEN RETURN NEW; END IF;
  FOREACH m IN ARRAY milestones LOOP
    IF OLD.xp_points < m AND NEW.xp_points >= m THEN
      PERFORM public.create_notification(
        NEW.id,
        'achievement',
        '⭐ Palier XP atteint !',
        'Vous avez atteint ' || m || ' XP. Continuez comme ça !',
        '/profil'
      );
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_xp_milestone ON public.profiles;
CREATE TRIGGER trg_notify_xp_milestone
  AFTER UPDATE OF xp_points ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_xp_milestone();
