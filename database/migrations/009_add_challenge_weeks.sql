-- Tag challenges with an optional week number so admins can organize
-- the Coding Arena into weekly competitions (e.g. "Week 1", "Week 2").
-- NULL means the challenge is "evergreen" — always visible regardless
-- of which week is active.
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS week INT;

CREATE INDEX IF NOT EXISTS idx_challenges_week ON challenges (week);

-- Tiny single-row settings table. Right now it only tracks which week
-- is "active" — the one students see on the Coding Arena by default,
-- and the one a season XP reset is associated with. Kept generic
-- (key/value) so future admin-configurable settings can reuse it
-- without another migration.
CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(60) PRIMARY KEY,
  value TEXT
);

INSERT INTO app_settings (key, value)
VALUES ('active_week', '1')
ON CONFLICT (key) DO NOTHING;