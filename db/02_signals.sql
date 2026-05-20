-- Run in Supabase SQL Editor.
-- Separates user vs AI signals and adds error pattern taxonomy (jsonb).
--
-- User: student_confidence (low | medium | high)
-- AI: error_types (jsonb array of fixed ids), scores, strengths, etc.
--
-- Optional: ALTER TABLE public.submissions DROP COLUMN IF EXISTS paths_to_ten;
-- (Drop only if you added paths_to_ten earlier and no longer need it.)

ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS student_confidence text,
ADD COLUMN IF NOT EXISTS error_types jsonb DEFAULT '[]'::jsonb;

UPDATE public.submissions
SET student_confidence = confidence_estimate
WHERE student_confidence IS NULL AND confidence_estimate IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'submissions_student_confidence_check'
  ) THEN
    ALTER TABLE public.submissions
    ADD CONSTRAINT submissions_student_confidence_check
    CHECK (
      student_confidence IS NULL
      OR student_confidence IN ('low', 'medium', 'high')
    );
  END IF;
END $$;
