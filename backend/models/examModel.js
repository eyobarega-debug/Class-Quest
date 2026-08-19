const db = require('../database'); // Adjust path to match your project's database wrapper
const bcrypt = require('bcrypt');

/**
 * Creates an exam with duration and optional password hash.
 */
async function createExam({ title, description, duration, password }) {
  let passwordHash = null;
  if (password && password.trim() !== '') {
    passwordHash = await bcrypt.hash(password, 10);
  }

  const query = `
    INSERT INTO exams (title, description, duration, password_hash)
    VALUES ($1, $2, $3, $4)
    RETURNING id, title, description, duration, (password_hash IS NOT NULL) AS "hasPassword";
  `;
  const result = await db.query(query, [title, description || '', duration, passwordHash]);
  return result.rows[0];
}

/**
 * Updates an existing exam's settings (duration and password).
 */
async function updateExam(id, { title, description, duration, password }) {
  let query = '';
  let params = [];

  if (password !== undefined && password !== null && password.trim() !== '') {
    const passwordHash = await bcrypt.hash(password, 10);
    query = `
      UPDATE exams
      SET title = $1, description = $2, duration = $3, password_hash = $4
      WHERE id = $5
      RETURNING id, title, description, duration, (password_hash IS NOT NULL) AS "hasPassword";
    `;
    params = [title, description, duration, passwordHash, id];
  } else {
    query = `
      UPDATE exams
      SET title = $1, description = $2, duration = $3
      WHERE id = $4
      RETURNING id, title, description, duration, (password_hash IS NOT NULL) AS "hasPassword";
    `;
    params = [title, description, duration, id];
  }

  const result = await db.query(query, params);
  return result.rows[0];
}

/**
 * Gets exam details for student view. NEVER returns password_hash.
 */
async function getExamForStudent(id) {
  const query = `
    SELECT id, title, description, duration, (password_hash IS NOT NULL) AS "requiresPassword"
    FROM exams
    WHERE id = $1;
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
}

/**
 * Verifies a student-provided exam password against the stored bcrypt hash.
 */
async function verifyExamPassword(examId, passwordInput) {
  const query = `SELECT password_hash FROM exams WHERE id = $1;`;
  const result = await db.query(query, [examId]);
  const exam = result.rows[0];

  if (!exam) return { found: false, valid: false };
  if (!exam.password_hash) return { found: true, valid: true }; // No password required

  const isMatch = await bcrypt.compare(passwordInput || '', exam.password_hash);
  return { found: true, valid: isMatch };
}

/**
 * Starts or retrieves an existing active exam attempt for timer enforcement.
 */
async function startOrGetAttempt(userId, examId) {
  const existingQuery = `
    SELECT id, started_at AS "startedAt", status
    FROM exam_attempts
    WHERE user_id = $1 AND exam_id = $2 AND status = 'in_progress';
  `;
  const existingRes = await db.query(existingQuery, [userId, examId]);

  if (existingRes.rows.length > 0) {
    return existingRes.rows[0];
  }

  const createQuery = `
    INSERT INTO exam_attempts (user_id, exam_id, started_at, status)
    VALUES ($1, $2, NOW(), 'in_progress')
    RETURNING id, started_at AS "startedAt", status;
  `;
  const createRes = await db.query(createQuery, [userId, examId]);
  return createRes.rows[0];
}

/**
 * Retrieves an attempt joined with exam duration to serve as backend timer truth.
 */
async function getAttemptWithExamDetails(attemptId) {
  const query = `
    SELECT ea.id, ea.user_id AS "userId", ea.exam_id AS "examId",
           ea.started_at AS "startedAt", ea.status, e.duration
    FROM exam_attempts ea
    JOIN exams e ON ea.exam_id = e.id
    WHERE ea.id = $1;
  `;
  const result = await db.query(query, [attemptId]);
  return result.rows[0];
}

/**
 * Updates attempt status (e.g., 'completed', 'expired').
 */
async function updateAttemptStatus(attemptId, status) {
  const query = `
    UPDATE exam_attempts
    SET status = $1, submitted_at = NOW()
    WHERE id = $2;
  `;
  await db.query(query, [status, attemptId]);
}

module.exports = {
  createExam,
  updateExam,
  getExamForStudent,
  verifyExamPassword,
  startOrGetAttempt,
  getAttemptWithExamDetails,
  updateAttemptStatus,
};