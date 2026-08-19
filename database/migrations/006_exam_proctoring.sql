-- ============================================================
-- Extend test monitoring (proctoring) to cover exams
-- ============================================================
-- Previously a test_session/test_violation always required a
-- challenge_id. Exams have questions that aren't a `challenges`
-- row at all (mcq/true_false/short_answer), so a session taken
-- during an exam needs to be able to attach to an exam_attempt
-- instead. challenge_id remains exactly as before for standalone
-- coding-challenge monitoring (unchanged behavior).

ALTER TABLE test_sessions ALTER COLUMN challenge_id DROP NOT NULL;
ALTER TABLE test_violations ALTER COLUMN challenge_id DROP NOT NULL;

ALTER TABLE test_sessions
    ADD COLUMN IF NOT EXISTS exam_attempt_id BIGINT
        REFERENCES exam_attempts(id) ON DELETE CASCADE;

ALTER TABLE test_violations
    ADD COLUMN IF NOT EXISTS exam_attempt_id BIGINT
        REFERENCES exam_attempts(id) ON DELETE CASCADE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'test_sessions_target_check'
    ) THEN
        ALTER TABLE test_sessions
            ADD CONSTRAINT test_sessions_target_check
            CHECK (challenge_id IS NOT NULL OR exam_attempt_id IS NOT NULL);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'test_violations_target_check'
    ) THEN
        ALTER TABLE test_violations
            ADD CONSTRAINT test_violations_target_check
            CHECK (challenge_id IS NOT NULL OR exam_attempt_id IS NOT NULL);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_test_sessions_exam_attempt ON test_sessions (exam_attempt_id);
CREATE INDEX IF NOT EXISTS idx_test_violations_exam_attempt ON test_violations (exam_attempt_id);