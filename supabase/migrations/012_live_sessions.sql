-- ============================================================
-- Migration 012 : Sessions Live (Jitsi Meet + programmation)
-- ============================================================

-- Nettoyage d'une éventuelle tentative partielle précédente
DROP TABLE IF EXISTS public.live_chat_messages CASCADE;
DROP TABLE IF EXISTS public.live_registrations CASCADE;
DROP TABLE IF EXISTS public.live_sessions CASCADE;

-- 1. Table des sessions live
CREATE TABLE public.live_sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id         uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  instructor_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id            uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  title             text NOT NULL,
  description       text,
  scheduled_at      timestamptz NOT NULL,
  duration_minutes  integer NOT NULL DEFAULT 60,
  status            text NOT NULL DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled','live','ended','cancelled')),
  platform          text NOT NULL DEFAULT 'jitsi'
                    CHECK (platform IN ('jitsi','zoom','google_meet','custom')),
  room_name         text NOT NULL UNIQUE,          -- ID de la salle Jitsi
  join_url          text,                           -- URL externe (Zoom / Meet)
  recording_url     text,                           -- Replay après la session
  max_participants  integer DEFAULT 100,
  is_public         boolean NOT NULL DEFAULT false, -- Visible dans le catalogue
  requires_enroll   boolean NOT NULL DEFAULT true,  -- Inscription obligatoire
  cover_url         text,
  tags              text[] DEFAULT '{}',
  started_at        timestamptz,
  ended_at          timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- 2. Inscriptions aux sessions live
CREATE TABLE public.live_registrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registered_at   timestamptz NOT NULL DEFAULT now(),
  attended        boolean DEFAULT false,
  join_time       timestamptz,
  leave_time      timestamptz,
  UNIQUE (session_id, user_id)
);

-- 3. Chat de la session (messages en temps réel via Supabase Realtime)
CREATE TABLE public.live_chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message     text NOT NULL,
  is_pinned   boolean DEFAULT false,
  is_question boolean DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 4. Index
CREATE INDEX idx_live_sessions_scheduled  ON public.live_sessions (scheduled_at, status);
CREATE INDEX idx_live_sessions_instructor ON public.live_sessions (instructor_id, status);
CREATE INDEX idx_live_sessions_course     ON public.live_sessions (course_id);
CREATE INDEX idx_live_registrations       ON public.live_registrations (session_id, user_id);
CREATE INDEX idx_live_chat_session        ON public.live_chat_messages (session_id, created_at DESC);

-- 5. RLS
ALTER TABLE public.live_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_registrations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages   ENABLE ROW LEVEL SECURITY;

-- Sessions : visibles par tous (publiques) ou par les inscrits au cours
CREATE POLICY "live_sessions_select" ON public.live_sessions FOR SELECT USING (
  is_public
  OR instructor_id = auth.uid()
  OR (course_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = live_sessions.course_id AND e.user_id = auth.uid()
  ))
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Formateur peut créer/modifier ses sessions
CREATE POLICY "live_sessions_instructor_write" ON public.live_sessions
  FOR ALL USING (instructor_id = auth.uid());

-- Inscriptions : visibles par le participant et le formateur
CREATE POLICY "live_reg_select" ON public.live_registrations FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.live_sessions ls
    WHERE ls.id = session_id AND ls.instructor_id = auth.uid()
  )
);
CREATE POLICY "live_reg_insert" ON public.live_registrations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "live_reg_update" ON public.live_registrations FOR UPDATE USING (user_id = auth.uid());

-- Chat : lisible par les inscrits, écrit par les inscrits
CREATE POLICY "live_chat_select" ON public.live_chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.live_registrations lr
    WHERE lr.session_id = live_chat_messages.session_id AND lr.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.live_sessions ls
    WHERE ls.id = session_id AND ls.instructor_id = auth.uid()
  )
);
CREATE POLICY "live_chat_insert" ON public.live_chat_messages FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.live_registrations lr
    WHERE lr.session_id = live_chat_messages.session_id AND lr.user_id = auth.uid()
  )
);

-- 6. Activer Realtime pour le chat live
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_sessions;
