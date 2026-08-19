-- ============================================================
-- ClassQuest Exams
-- Adds MCQ / True-False / Short-Answer questions, an exam
-- password, and a backend-enforced exam timer, WITHOUT touching
-- the existing challenges / test_cases / submissions tables
-- that power the coding-question Run/Submit flow.
-- ============================================================

-- An exam is a timed, optionally password-protected container
-- of questions (mcq / true_false / short_answer / coding).
CREATE TABLE IF NOT EXISTS exams (
    id BIGSERIAL PRIMARY KEY,

    title VARCHAR(150) NOT NULL,
    description TEXT,

    duration_minutes INT NOT NULL,

    -- NULL means "no password required" (keeps existing/legacy
    -- exams usable without forcing a password on everyone).
    password_hash TEXT,

    is_published BOOLEAN NOT NULL DEFAULT false,

    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT exams_duration_check CHECK (duration_minutes > 0)
);

-- A question that belongs to an exam. For type = 'coding' the
-- question is just a pointer to an existing challenges row —
-- the coding editor / Run / Submit system is reused as-is and
-- none of its tables or logic are modified.
CREATE TABLE IF NOT EXISTS exam_questions (
    id BIGSERIAL PRIMARY KEY,

    exam_id BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,

    type VARCHAR(20) NOT NULL
        CHECK (type IN ('mcq', 'true_false', 'short_answer', 'coding')),

    question TEXT,           -- required for mcq / true_false / short_answer
    points INT NOT NULL DEFAULT 1 CHECK (points > 0),
    order_index INT NOT NULL DEFAULT 0,

    -- mcq: {"options": ["...","...","...","..."], "correctOption": "A"}
    -- true_false: {"correctAnswer": true}
    -- short_answer: {"expectedAnswer": "Central Processing Unit"}
    -- coding: NULL (see challenge_id below)
    data JSONB,

    -- Only set (and only meaningful) when type = 'coding'.
    -- Points out to the pre-existing challenges table.
    challenge_id BIGINT REFERENCES challenges(id) ON DELETE RESTRICT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT exam_questions_coding_needs_challenge
        CHECK (type <> 'coding' OR challenge_id IS NOT NULL),
    CONSTRAINT exam_questions_non_coding_needs_question_text
        CHECK (type = 'coding' OR (question IS NOT NULL AND length(trim(question)) > 0))
);

-- One row per student attempt at an exam. Mirrors the shape of
-- the existing test_sessions table (started_at/ended_at/status)
-- so the backend can be the single source of truth for timing:
-- remaining time = duration_minutes - (now - started_at).
CREATE TABLE IF NOT EXISTS exam_attempts (
    id BIGSERIAL PRIMARY KEY,

    exam_id BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,

    status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'submitted', 'expired')),

    total_score INT NOT NULL DEFAULT 0,
    max_score INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- A student may only have one active attempt per exam at a time.
    CONSTRAINT exam_attempts_one_active_per_user
        UNIQUE (exam_id, user_id, status)
);

-- Student answers for mcq / true_false / short_answer questions.
-- Coding-question answers/results continue to live entirely in
-- the existing submissions table (linked via exam_attempt_id
-- added below) so the Run/Submit code path is untouched.
CREATE TABLE IF NOT EXISTS exam_answers (
    id BIGSERIAL PRIMARY KEY,

    exam_attempt_id BIGINT NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
    exam_question_id BIGINT NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
-- Raw student answer: selected option letter, "true"/"false", or free text.
    answer TEXT,

    is_correct BOOLEAN,
    points_awarded INT NOT NULL DEFAULT 0,

    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (exam_attempt_id, exam_question_id)
);

-- Link existing submissions to an exam attempt, when a coding
-- question is answered as part of an exam. Nullable so ordinary
-- (non-exam) challenge submissions are completely unaffected.
ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS exam_attempt_id BIGINT REFERENCES exam_attempts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON exam_questions (exam_id, order_index);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam_user ON exam_attempts (exam_id, user_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_attempt ON exam_answers (exam_attempt_id);
CREATE INDEX IF NOT EXISTS idx_submissions_exam_attempt ON submissions (exam_attempt_id);