const pool = require('../config/db');

async function recordSubmission({ userId, challengeId, language, mode, code, status, passedCount, totalCount, executionTimeMs }) {
  const { rows } = await pool.query(
    `INSERT INTO submissions
      (user_id, challenge_id, language, mode, code, status, passed_count, total_count, execution_time_ms)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id, status, passed_count, total_count, created_at`,
    [userId, challengeId, language, mode, code, status, passedCount, totalCount, executionTimeMs]
  );
  return rows[0];
}

// Has this student ever gotten an "accepted" SUBMIT (not run) on this
// challenge before? Phase 4's XP system will call this to enforce
// "a challenge should normally award its XP only once per student"
// (brief section 14) - built now so Phase 4 doesn't need a schema change.
async function hasAcceptedSubmit(userId, challengeId) {
  const { rows } = await pool.query(
    `SELECT id FROM submissions
     WHERE user_id = $1 AND challenge_id = $2 AND mode = 'submit' AND status = 'accepted'
     LIMIT 1`,
    [userId, challengeId]
  );
  return rows.length > 0;
}

module.exports = { recordSubmission, hasAcceptedSubmit };