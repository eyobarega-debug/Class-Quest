-- ============================================================
-- ClassQuest Test Monitoring
-- ============================================================

-- A monitoring session represents one student's test session.
CREATE TABLE IF NOT EXISTS test_sessions (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    challenge_id INTEGER NOT NULL
        REFERENCES challenges(id)
        ON DELETE CASCADE,

    started_at TIMESTAMP NOT NULL DEFAULT NOW(),

    ended_at TIMESTAMP,

    status VARCHAR(30) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'completed', 'terminated')),

    violation_count INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Every suspicious/monitoring event is stored here.
CREATE TABLE IF NOT EXISTS test_violations (
    id SERIAL PRIMARY KEY,

    session_id INTEGER NOT NULL
        REFERENCES test_sessions(id)
        ON DELETE CASCADE,

    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    challenge_id INTEGER NOT NULL
        REFERENCES challenges(id)
        ON DELETE CASCADE,

    event_type VARCHAR(50) NOT NULL,

    severity VARCHAR(20) NOT NULL DEFAULT 'medium'
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    application_name VARCHAR(255),

    window_title TEXT,

    details JSONB,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Faster admin queries.
CREATE INDEX IF NOT EXISTS idx_test_sessions_user
    ON test_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_test_sessions_challenge
    ON test_sessions(challenge_id);

CREATE INDEX IF NOT EXISTS idx_test_violations_session
    ON test_violations(session_id);

CREATE INDEX IF NOT EXISTS idx_test_violations_user
    ON test_violations(user_id);

CREATE INDEX IF NOT EXISTS idx_test_violations_created
    ON test_violations(created_at);

CREATE INDEX IF NOT EXISTS idx_test_violations_type
    ON test_violations(event_type);