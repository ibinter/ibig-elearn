-- ============================================================
-- Migration 016 : Champs onboarding sur profiles
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS goals              text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interests          text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS learning_frequency text,
  ADD COLUMN IF NOT EXISTS preferred_level    text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
