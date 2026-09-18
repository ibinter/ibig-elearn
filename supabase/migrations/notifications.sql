-- Table notifications in-app
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'system',
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  url         TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own notifications" ON notifications;
CREATE POLICY "Own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Permettre l'insertion par service role (pour les triggers et APIs)
DROP POLICY IF EXISTS "Service insert notifications" ON notifications;
CREATE POLICY "Service insert notifications" ON notifications FOR INSERT WITH CHECK (true);
