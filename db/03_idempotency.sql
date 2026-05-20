-- Adds a client-generated idempotency key to prevent duplicate inserts.
-- A UUID is generated in the browser on each submit click and sent with the request.
-- The partial unique index enforces uniqueness only for non-null values so that
-- existing rows (NULL submission_id) and seed data are unaffected.

ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS submission_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS submissions_submission_id_key
  ON public.submissions (submission_id)
  WHERE submission_id IS NOT NULL;
