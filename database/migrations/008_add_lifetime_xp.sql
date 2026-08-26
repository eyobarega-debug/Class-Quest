-- Two-tier XP system: "xp" is the CURRENT total shown on the main
-- leaderboard and used for level calculation — admins can reset this
-- per-student to start a fresh competition (e.g. a new week).
-- "lifetime_xp" is a permanent running total that is never reset and
-- always reflects everything the student has ever earned, powering a
-- separate All-Time leaderboard.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS lifetime_xp INT NOT NULL DEFAULT 0;

-- Backfill: for existing students, their lifetime total so far is
-- whatever their current xp already is.
UPDATE users
  SET lifetime_xp = xp
  WHERE lifetime_xp = 0;

CREATE INDEX IF NOT EXISTS idx_users_lifetime_xp ON users (lifetime_xp DESC);