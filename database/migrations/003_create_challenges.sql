CREATE TABLE IF NOT EXISTS challenges (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(160) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    category VARCHAR(60),
    tags TEXT[] DEFAULT '{}',
    xp_reward INT NOT NULL DEFAULT 100,
    time_limit_ms INT NOT NULL DEFAULT 2000,
    memory_limit_mb INT NOT NULL DEFAULT 128,
    constraints TEXT,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT challenges_difficulty_check
        CHECK (difficulty IN ('easy', 'medium', 'hard'))
);

CREATE TABLE IF NOT EXISTS challenge_languages (
    id BIGSERIAL PRIMARY KEY,
    challenge_id BIGINT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    language VARCHAR(30) NOT NULL,
    starter_code TEXT DEFAULT '',
    UNIQUE (challenge_id, language)
);

CREATE TABLE IF NOT EXISTS test_cases (
    id BIGSERIAL PRIMARY KEY,
    challenge_id BIGINT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    input TEXT DEFAULT '',
    expected_output TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    order_index INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS submissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id BIGINT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    language VARCHAR(30) NOT NULL,
    source_code TEXT NOT NULL,
    status VARCHAR(30) NOT NULL,
    passed_tests INT NOT NULL DEFAULT 0,
    total_tests INT NOT NULL DEFAULT 0,
    execution_time_ms INT,
    xp_earned INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT submissions_status_check
        CHECK (status IN ('accepted','wrong_answer','compilation_error','runtime_error','time_limit_exceeded','unsupported_language'))
);

CREATE INDEX IF NOT EXISTS idx_challenges_slug ON challenges (slug);
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON challenges (difficulty);
CREATE INDEX IF NOT EXISTS idx_test_cases_challenge ON test_cases (challenge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_challenge ON submissions (user_id, challenge_id);