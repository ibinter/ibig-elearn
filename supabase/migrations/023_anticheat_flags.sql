-- Anti-triche : colonnes pour tracer les comportements suspects

ALTER TABLE public.final_exam_attempts
  ADD COLUMN IF NOT EXISTS tab_switch_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS flag_reason TEXT;

ALTER TABLE public.quiz_attempts
  ADD COLUMN IF NOT EXISTS tab_switch_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS flag_reason TEXT;
