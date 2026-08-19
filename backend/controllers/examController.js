const bcrypt = require('bcrypt');
const pool = require('../config/db');

// POST /api/exams (Admin - Create Exam)
async function createExam(req, res) {
  try {
    const { title, description, duration, password } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Exam title is required.' });
    }

    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      return res.status(400).json({ error: 'Duration must be a positive number of minutes.' });
    }

    let passwordHash = null;
    if (password && typeof password === 'string' && password.trim() !== '') {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const { rows } = await pool.query(
      `INSERT INTO exams (title, description, duration, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, description, duration, (password_hash IS NOT NULL) AS "hasPassword"`,
      [title.trim(), description || '', durationNum, passwordHash]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create exam.' });
  }
}

// PUT /api/exams/:id (Admin - Update Exam Settings)
async function updateExam(req, res) {
  try {
    const { id } = req.params;
    const { title, description, duration, password } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Exam title is required.' });
    }

    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      return res.status(400).json({ error: 'Duration must be a positive number of minutes.' });
    }

    let query = '';
    let params = [];

    if (password !== undefined && password !== null && password.trim() !== '') {
      const passwordHash = await bcrypt.hash(password.trim(), 10);
      query = `
        UPDATE exams
        SET title = $1, description = $2, duration = $3, password_hash = $4
        WHERE id = $5
        RETURNING id, title, description, duration, (password_hash IS NOT NULL) AS "hasPassword"
      `;
      params = [title.trim(), description || '', durationNum, passwordHash, id];
    } else {
      query = `
        UPDATE exams
        SET title = $1, description = $2, duration = $3
        WHERE id = $4
        RETURNING id, title, description, duration, (password_hash IS NOT NULL) AS "hasPassword"
      `;
      params = [title.trim(), description || '', durationNum, id];
    }

    const { rows } = await pool.query(query, params);
    if (!rows[0]) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update exam.' });
  }
}

// POST /api/exams/:id/verify-password (Student Password Gate)
async function verifyPassword(req, res) {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const { rows } = await pool.query('SELECT password_hash FROM exams WHERE id = $1', [id]);
    const exam = rows[0];

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    // If no password is set on the exam
    if (!exam.password_hash) {
      return res.json({ success: true, message: 'No password required.' });
    }

    const isMatch = await bcrypt.compare(password || '', exam.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect exam password.' });
    }

    return res.json({ success: true, message: 'Password verified.' });
  } catch (err) {
    return res.status(500).json({ error: 'Password verification failed.' });
  }
}

// POST /api/exams/:id/start (Student - Start Attempt & Record Server Time)
async function startExam(req, res) {
  try {
    const { id: examId } = req.params;
    const userId = req.user.id;

    const examRes = await pool.query('SELECT duration FROM exams WHERE id = $1', [examId]);
    if (!examRes.rows[0]) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    // Retrieve or record active attempt
    let attemptRes = await pool.query(
      'SELECT id, started_at, status FROM exam_attempts WHERE exam_id = $1 AND user_id = $2 AND status = $3',
      [examId, userId, 'in_progress']
    );

    if (attemptRes.rows.length === 0) {
      attemptRes = await pool.query(
        'INSERT INTO exam_attempts (exam_id, user_id, started_at, status) VALUES ($1, $2, NOW(), $3) RETURNING id, started_at, status',
        [examId, userId, 'in_progress']
      );
    }

    const attempt = attemptRes.rows[0];

    return res.json({
      attemptId: attempt.id,
      startedAt: attempt.started_at,
      durationMinutes: examRes.rows[0].duration,
      status: attempt.status,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to start exam session.' });
  }
}

module.exports = {
  createExam,
  updateExam,
  verifyPassword,
  startExam,
};