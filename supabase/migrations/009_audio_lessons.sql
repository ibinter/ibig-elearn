-- ============================================================
-- Migration 009 : Support des leçons audio (MP3 / podcast)
-- ============================================================

-- 1. Ajouter 'audio' comme type de leçon valide
ALTER TABLE public.lessons
  DROP CONSTRAINT IF EXISTS lessons_type_check;

ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_type_check
  CHECK (type IN ('video','document','quiz','assignment','final_exam','audio'));

-- 2. Colonnes spécifiques aux leçons audio
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS audio_url         text,          -- URL fichier MP3 (Bunny Storage ou autre)
  ADD COLUMN IF NOT EXISTS audio_duration_s  integer,       -- Durée en secondes
  ADD COLUMN IF NOT EXISTS audio_size_bytes  bigint,        -- Taille fichier
  ADD COLUMN IF NOT EXISTS audio_transcript  text,          -- Transcription (optionnelle, pour accessibilité)
  ADD COLUMN IF NOT EXISTS audio_cover_url   text;          -- Image de couverture (artwork)

-- 3. Index pour retrouver rapidement les leçons audio d'une formation
CREATE INDEX IF NOT EXISTS idx_lessons_audio
  ON public.lessons (type, module_id)
  WHERE type = 'audio';
