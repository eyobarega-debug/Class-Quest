const pool = require('../config/db');

// Existing recordSubmission function...

async function recordNonCodingSubmission({ userId, questionId, attemptId, answer, isCorrect, earnedPoints, status }) {
  const { rows } = await pool.query(
    `INSERT INTO student_answers (user_id, question_id, attempt_id, submitted_answer, is_correct, points_earned, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (attempt_id, question_id) DO UPDATE SET
       submitted_answer = EXCLUDED.submitted_answer,
       is_correct = EXCLUDED.is_correct,
       points_earned = EXCLUDED.points_earned,
       status = EXCLUDED.status,
       updated_at = NOW()
     RETURNING *`,
    [userId, questionId, attemptId, String(answer), isCorrect, earnedPoints, status]
  );
  return rows[0];
}

module.exports = {
  // export existing functions...
  recordNonCodingSubmission,
};