-- Admin approval gate for exam results: a student's score is only
-- meant to be visible once an admin has reviewed and approved it.
ALTER TABLE exam_attempts
    ADD COLUMN IF NOT EXISTS result_approved BOOLEAN NOT NULL DEFAULT false;