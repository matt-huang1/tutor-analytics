-- Run this in Supabase SQL Editor
-- Adds new educational diagnostics columns to public.submissions.

ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS topic text,
ADD COLUMN IF NOT EXISTS subtopic text,
ADD COLUMN IF NOT EXISTS strengths jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS misconceptions jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS missing_concepts jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS suggested_next_step text,
ADD COLUMN IF NOT EXISTS confidence_estimate text,
ADD COLUMN IF NOT EXISTS reasoning_quality integer,
ADD COLUMN IF NOT EXISTS answer_completeness integer;

-- Optional but recommended constraints for cleaner data.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'submissions_confidence_estimate_check'
  ) THEN
    ALTER TABLE public.submissions
    ADD CONSTRAINT submissions_confidence_estimate_check
    CHECK (
      confidence_estimate IS NULL
      OR confidence_estimate IN ('low', 'medium', 'high')
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'submissions_score_range_check'
  ) THEN
    ALTER TABLE public.submissions
    ADD CONSTRAINT submissions_score_range_check
    CHECK (score IS NULL OR (score >= 1 AND score <= 10));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'submissions_reasoning_quality_range_check'
  ) THEN
    ALTER TABLE public.submissions
    ADD CONSTRAINT submissions_reasoning_quality_range_check
    CHECK (reasoning_quality IS NULL OR (reasoning_quality >= 1 AND reasoning_quality <= 10));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'submissions_answer_completeness_range_check'
  ) THEN
    ALTER TABLE public.submissions
    ADD CONSTRAINT submissions_answer_completeness_range_check
    CHECK (answer_completeness IS NULL OR (answer_completeness >= 1 AND answer_completeness <= 10));
  END IF;
END
$$;
