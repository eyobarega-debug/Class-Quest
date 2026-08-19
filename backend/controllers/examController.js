const bcrypt = require('bcrypt');
const pool = require('../config/db');

// ======================================================
// POST /api/exams
// Admin - Create Exam
// ======================================================
async function createExam(req, res) {
  try {
    const { title, description, duration, password } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        error: 'Exam title is required.',
      });
    }

    const durationNum = parseInt(duration, 10);

    if (isNaN(durationNum) || durationNum <= 0) {
      return res.status(400).json({
        error: 'Duration must be a positive number of minutes.',
      });
    }

    let passwordHash = null;

    if (
      password &&
      typeof password === 'string' &&
      password.trim() !== ''
    ) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const { rows } = await pool.query(
      `INSERT INTO exams
        (title, description, duration, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING
        id,
        title,
        description,
        duration,
        (password_hash IS NOT NULL) AS "hasPassword"`,
      [
        title.trim(),
        description || '',
        durationNum,
        passwordHash,
      ]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create exam error:', err);

    return res.status(500).json({
      error: 'Failed to create exam.',
    });
  }
}


// ======================================================
// GET /api/exams
// Authenticated users - Get all available exams
// ======================================================
async function getExams(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT
        id,
        title,
        description,
        duration,
        (password_hash IS NOT NULL) AS "requiresPassword"
       FROM exams
       ORDER BY id DESC`
    );

    return res.status(200).json({
      exams: rows,
    });
  } catch (err) {
    console.error('Get exams error:', err);

    return res.status(500).json({
      error: 'Failed to fetch exams.',
    });
  }
}


// ======================================================
// GET /api/exams/:id
// Get one exam
// ======================================================
async function getExam(req, res) {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT
        id,
        title,
        description,
        duration,
        (password_hash IS NOT NULL) AS "requiresPassword"
       FROM exams
       WHERE id = $1`,
      [id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        error: 'Exam not found.',
      });
    }

    return res.status(200).json({
      exam: rows[0],
    });
  } catch (err) {
    console.error('Get exam error:', err);

    return res.status(500).json({
      error: 'Failed to fetch exam.',
    });
  }
}


// ======================================================
// PUT /api/exams/:id
// Admin - Update Exam
// ======================================================
async function updateExam(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      duration,
      password,
    } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        error: 'Exam title is required.',
      });
    }

    const durationNum = parseInt(duration, 10);

    if (isNaN(durationNum) || durationNum <= 0) {
      return res.status(400).json({
        error: 'Duration must be a positive number of minutes.',
      });
    }

    let query;
    let params;

    // Update password if a new password was provided
    if (
      password !== undefined &&
      password !== null &&
      typeof password === 'string' &&
      password.trim() !== ''
    ) {
      const passwordHash = await bcrypt.hash(
        password.trim(),
        10
      );

      query = `
        UPDATE exams
        SET
          title = $1,
          description = $2,
          duration = $3,
          password_hash = $4
        WHERE id = $5
        RETURNING
          id,
          title,
          description,
          duration,
          (password_hash IS NOT NULL) AS "hasPassword"
      `;

      params = [
        title.trim(),
        description || '',
        durationNum,
        passwordHash,
        id,
      ];
    } else {
      query = `
        UPDATE exams
        SET
          title = $1,
          description = $2,
          duration = $3
        WHERE id = $4
        RETURNING
          id,
          title,
          description,
          duration,
          (password_hash IS NOT NULL) AS "hasPassword"
      `;

      params = [
        title.trim(),
        description || '',
        durationNum,
        id,
      ];
    }

    const { rows } = await pool.query(query, params);

    if (!rows[0]) {
      return res.status(404).json({
        error: 'Exam not found.',
      });
    }

    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Update exam error:', err);

    return res.status(500).json({
      error: 'Failed to update exam.',
    });
  }
}


// ======================================================
// POST /api/exams/:id/verify-password
// Student - Verify Exam Password
// ======================================================
async function verifyPassword(req, res) {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const { rows } = await pool.query(
      `SELECT password_hash
       FROM exams
       WHERE id = $1`,
      [id]
    );

    const exam = rows[0];

    if (!exam) {
      return res.status(404).json({
        error: 'Exam not found.',
      });
    }

    // No password required
    if (!exam.password_hash) {
      return res.json({
        success: true,
        message: 'No password required.',
      });
    }

    const isMatch = await bcrypt.compare(
      password || '',
      exam.password_hash
    );

    if (!isMatch) {
      return res.status(401).json({
        error: 'Incorrect exam password.',
      });
    }

    return res.json({
      success: true,
      message: 'Password verified.',
    });
  } catch (err) {
    console.error('Verify password error:', err);

    return res.status(500).json({
      error: 'Password verification failed.',
    });
  }
}


// ======================================================
// POST /api/exams/:id/start
// Student - Start Exam
// ======================================================
async function startExam(req, res) {
  try {
    const { id: examId } = req.params;
    const userId = req.user.id;

    // Check that exam exists
    const examRes = await pool.query(
      `SELECT
        id,
        title,
        description,
        duration,
        (password_hash IS NOT NULL) AS "requiresPassword"
       FROM exams
       WHERE id = $1`,
      [examId]
    );

    if (!examRes.rows[0]) {
      return res.status(404).json({
        error: 'Exam not found.',
      });
    }

    const exam = examRes.rows[0];

    // Check if student already has an active attempt
    let attemptRes = await pool.query(
      `SELECT
        id,
        started_at,
        status
       FROM exam_attempts
       WHERE exam_id = $1
         AND user_id = $2
         AND status = 'in_progress'`,
      [examId, userId]
    );

    // Create attempt if one doesn't exist
    if (attemptRes.rows.length === 0) {
      attemptRes = await pool.query(
        `INSERT INTO exam_attempts
          (exam_id, user_id, started_at, status)
         VALUES ($1, $2, NOW(), 'in_progress')
         RETURNING
          id,
          started_at,
          status`,
        [examId, userId]
      );
    }

    const attempt = attemptRes.rows[0];

    return res.status(200).json({
      attemptId: attempt.id,
      startedAt: attempt.started_at,
      durationMinutes: exam.duration,
      status: attempt.status,
      exam,
    });
  } catch (err) {
    console.error('Start exam error:', err);

    return res.status(500).json({
      error: 'Failed to start exam session.',
    });
  }
}


// ======================================================
// EXPORTS
// ======================================================
module.exports = {
  createExam,
  getExams,
  getExam,
  updateExam,
  verifyPassword,
  startExam,
};