import pool from "../config/db.js";

// ---------------------------------------------------------------------
// Exams
// ---------------------------------------------------------------------

const EXAM_LIST_COLUMNS = `
  id, title, description, duration_minutes,
  (password_hash IS NOT NULL) AS has_password,
  is_published, created_by, created_at, updated_at
`;

export async function listExams({ publishedOnly = false } = {}) {
  const where = publishedOnly ? "WHERE is_published = true" : "";
  const result = await pool.query(
    `SELECT ${EXAM_LIST_COLUMNS} FROM exams ${where} ORDER BY created_at DESC`
  );
  return result.rows;
}

// Safe to return to anyone (students or admins) — never includes password_hash.
export async function getExamById(id) {
  const result = await pool.query(
    `SELECT ${EXAM_LIST_COLUMNS} FROM exams WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

// Internal use only — includes password_hash. Never return this
// object directly from an API route.
export async function getExamWithPasswordHash(id) {
  const result = await pool.query(`SELECT * FROM exams WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

export async function createExam({
  title,
  description,
  durationMinutes,
  passwordHash, // null if no password
  createdBy,
}) {
  const result = await pool.query(
    `INSERT INTO exams (title, description, duration_minutes, password_hash, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${EXAM_LIST_COLUMNS}`,
    [title, description || null, durationMinutes, passwordHash || null, createdBy]
  );
  return result.rows[0];
}

const UPDATE_FIELD_MAP = {
  title: "title",
  description: "description",
  durationMinutes: "duration_minutes",
  isPublished: "is_published",
};

// A student may attempt an exam exactly once. Once their attempt has
// been submitted (or auto-expired), this returns it so startExam can
// block any further attempts.
export async function getCompletedAttempt(examId, userId) {
  const result = await pool.query(
    `SELECT * FROM exam_attempts
     WHERE exam_id = $1 AND user_id = $2 AND status IN ('submitted', 'expired')
     ORDER BY started_at DESC
     LIMIT 1`,
    [examId, userId]
  );
  return result.rows[0] || null;
}

// Updates ordinary exam fields. Password is changed separately via
// updateExamPassword() so it can never be set through a generic
// "patch this object" call by mistake.
export async function updateExam(id, fields) {
  const sets = [];
  const params = [];

  for (const [key, value] of Object.entries(fields)) {
    const column = UPDATE_FIELD_MAP[key];
    if (!column || value === undefined) continue;   // ← added `|| value === undefined`
    params.push(value);
    sets.push(`${column} = $${params.length}`);
  }

  if (sets.length === 0) return getExamById(id);

  params.push(id);

  const result = await pool.query(
    `UPDATE exams SET ${sets.join(", ")}, updated_at = NOW()
     WHERE id = $${params.length} RETURNING ${EXAM_LIST_COLUMNS}`,
    params
  );

  return result.rows[0] || null;
}

export async function updateExamPassword(id, passwordHash) {
  // passwordHash may be null, to remove the password requirement.
  const result = await pool.query(
    `UPDATE exams SET password_hash = $1, updated_at = NOW()
     WHERE id = $2 RETURNING ${EXAM_LIST_COLUMNS}`,
    [passwordHash, id]
  );
  return result.rows[0] || null;
}

export async function deleteExam(id) {
  const result = await pool.query(
    `DELETE FROM exams WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows.length > 0;
}

// ---------------------------------------------------------------------
// Exam questions
// ---------------------------------------------------------------------

// Admin view: includes correct answers (data column) so the exam can
// be edited. Never expose this to a student mid-exam.
export async function getExamQuestionsForAdmin(examId) {
  const result = await pool.query(
    `
    SELECT eq.*, c.title AS challenge_title, c.slug AS challenge_slug
    FROM exam_questions eq
    LEFT JOIN challenges c ON c.id = eq.challenge_id
    WHERE eq.exam_id = $1
    ORDER BY eq.order_index ASC, eq.id ASC
    `,
    [examId]
  );
  return result.rows;
}

// Student view: strips correct answers out of `data` for
// mcq/true_false/short_answer, and for coding questions leaves the
// question row as a pointer only (the existing challenge endpoints
// are used to actually fetch/run/submit the coding question).
export async function getExamQuestionsForStudent(examId) {
  const rows = await getExamQuestionsForAdmin(examId);

  return rows.map((row) => {
    const base = {
      id: row.id,
      examId: row.exam_id,
      type: row.type,
      question: row.question,
      points: row.points,
      orderIndex: row.order_index,
    };

    if (row.type === "mcq") {
      return { ...base, options: row.data?.options || [] };
    }

    if (row.type === "true_false") {
      return base; // no options needed, just True/False in the UI
    }

    if (row.type === "short_answer") {
      return base; // no expected answer leaked
    }

    // coding
    return {
      ...base,
      challengeId: row.challenge_id,
      challengeSlug: row.challenge_slug,
      challengeTitle: row.challenge_title,
    };
  });
}

export async function getExamQuestionById(id) {
  const result = await pool.query(
    `SELECT * FROM exam_questions WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function createExamQuestion({
  examId,
  type,
  question,
  points,
  orderIndex,
  data, // { options, correctOption } | { correctAnswer } | { expectedAnswer } | null
  challengeId, // only for type = "coding"
}) {
  const result = await pool.query(
    `INSERT INTO exam_questions (exam_id, type, question, points, order_index, data, challenge_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      examId,
      type,
      type === "coding" ? null : question,
      points || 1,
      orderIndex || 0,
      type === "coding" ? null : data,
      type === "coding" ? challengeId : null,
    ]
  );
  return result.rows[0];
}

// Every attempt a given user has made, across all exams — used to
// mark exams "Completed" in the student's exam list so they can't
// click back into one they already finished.
export async function getAttemptStatusesForUser(userId) {
  const result = await pool.query(
    `SELECT exam_id, status, total_score, max_score
     FROM exam_attempts
     WHERE user_id = $1`,
    [userId]
  );
  return result.rows;
}
// Create many questions on one exam in a single call — used by the
// "bulk add" admin UI so a whole exam's worth of mcq/true_false/
// short_answer/coding questions can be pasted in at once instead of
// adding them one at a time. All-or-nothing: if one row is bad, none
// of them are inserted.
export async function bulkCreateExamQuestions(examId, questions) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const created = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      const result = await client.query(
        `INSERT INTO exam_questions (exam_id, type, question, points, order_index, data, challenge_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          examId,
          q.type,
          q.type === "coding" ? null : q.question,
          q.points || 1,
          q.orderIndex ?? i,
          q.type === "coding" ? null : q.data,
          q.type === "coding" ? q.challengeId : null,
        ]
      );

      created.push(result.rows[0]);
    }

    await client.query("COMMIT");
    return created;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateExamQuestion(id, fields) {
  const sets = [];
  const params = [];

  const map = {
    question: "question",
    points: "points",
    orderIndex: "order_index",
    data: "data",
    challengeId: "challenge_id",
  };

   for (const [key, value] of Object.entries(fields)) {
    const column = map[key];
    if (!column || value === undefined) continue;   // ← added `|| value === undefined`
    params.push(value);
    sets.push(`${column} = $${params.length}`);
  }

  if (sets.length === 0) return getExamQuestionById(id);

  params.push(id);

  const result = await pool.query(
    `UPDATE exam_questions SET ${sets.join(", ")}, updated_at = NOW()
     WHERE id = $${params.length} RETURNING *`,
    params
  );

  return result.rows[0] || null;
}

export async function deleteExamQuestion(id) {
  const result = await pool.query(
    `DELETE FROM exam_questions WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows.length > 0;
}

// ---------------------------------------------------------------------
// Exam attempts (backend-authoritative timer)
// ---------------------------------------------------------------------

export async function getActiveAttempt(examId, userId) {
  const result = await pool.query(
    `SELECT * FROM exam_attempts
     WHERE exam_id = $1 AND user_id = $2 AND status = 'in_progress'
     LIMIT 1`,
    [examId, userId]
  );
  return result.rows[0] || null;
}

export async function getAttemptById(id) {
  const result = await pool.query(`SELECT * FROM exam_attempts WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

// ---------------------------------------------------------------------
// Admin: approve student's exam result
// ---------------------------------------------------------------------

export async function approveExamResult(attemptId) {
  const result = await pool.query(
    `
    UPDATE exam_attempts
    SET result_approved = true
    WHERE id = $1
      AND status IN ('submitted', 'expired')
    RETURNING *
    `,
    [attemptId]
  );

  return result.rows[0] || null;
}

export async function createAttempt(examId, userId) {
  const result = await pool.query(
    `INSERT INTO exam_attempts (exam_id, user_id)
     VALUES ($1, $2)
     RETURNING *`,
    [examId, userId]
  );
  return result.rows[0];
}

export async function markAttemptStatus(id, status, { totalScore, maxScore } = {}) {
  const result = await pool.query(
    `UPDATE exam_attempts
     SET status = $1,
         submitted_at = CASE WHEN $5 IN ('submitted', 'expired') THEN NOW() ELSE submitted_at END,
         total_score = COALESCE($2, total_score),
         max_score = COALESCE($3, max_score)
     WHERE id = $4
     RETURNING *`,
    [status, totalScore ?? null, maxScore ?? null, id, status]
  );
  return result.rows[0] || null;
}

// ---------------------------------------------------------------------
// Admin: flat feed of every exam answer across every exam (for the
// "Submissions" dashboard, so MCQ/True-False/Short-Answer answers
// show up there too, not just coding submissions). Newest first.
// ---------------------------------------------------------------------
export async function listExamAnswersForAdmin({ userId, examId, limit = 200, offset = 0 } = {}) {
  const conditions = [];
  const params = [];

  if (userId) {
    params.push(userId);
    conditions.push(`a.user_id = $${params.length}`);
  }

  if (examId) {
    params.push(examId);
    conditions.push(`ex.id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  params.push(limit);
  params.push(offset);

  const result = await pool.query(
    `
    SELECT
      ea.id, ea.answer, ea.is_correct, ea.points_awarded, ea.answered_at,
      eq.id AS exam_question_id, eq.type AS question_type, eq.question, eq.points AS question_points, eq.data,
      ex.id AS exam_id, ex.title AS exam_title,
      a.id AS attempt_id, a.status AS attempt_status,
      u.id AS user_id, u.username, u.full_name
    FROM exam_answers ea
    JOIN exam_questions eq ON eq.id = ea.exam_question_id
    JOIN exams ex ON ex.id = eq.exam_id
    JOIN exam_attempts a ON a.id = ea.exam_attempt_id
    JOIN users u ON u.id = a.user_id
    ${where}
    ORDER BY ea.answered_at DESC
    LIMIT $${params.length - 1}
    OFFSET $${params.length}
    `,
    params
  );

  return result.rows;
}

// ---------------------------------------------------------------------
// Exam answers (mcq / true_false / short_answer only — coding answers
// stay in the existing `submissions` table)
// ---------------------------------------------------------------------

export async function upsertExamAnswer({
  examAttemptId,
  examQuestionId,
  answer,
  isCorrect,
  pointsAwarded,
}) {
  const result = await pool.query(
    `INSERT INTO exam_answers (exam_attempt_id, exam_question_id, answer, is_correct, points_awarded)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (exam_attempt_id, exam_question_id)
     DO UPDATE SET answer = EXCLUDED.answer,
                    is_correct = EXCLUDED.is_correct,
                    points_awarded = EXCLUDED.points_awarded,
                    answered_at = NOW()
     RETURNING *`,
    [examAttemptId, examQuestionId, answer, isCorrect, pointsAwarded || 0]
  );
  return result.rows[0];
}

export async function getAttemptAnswers(examAttemptId) {
  const result = await pool.query(
    `SELECT * FROM exam_answers WHERE exam_attempt_id = $1`,
    [examAttemptId]
  );
  return result.rows;
}

// ---------------------------------------------------------------------
// Admin: see what students have done on an exam
// ---------------------------------------------------------------------

// Every attempt (in progress, submitted, or expired) on this exam,
// with the student joined in, newest first. Score is already stored
// as totalScore/maxScore ("out of" the exam's points), not XP.
export async function listAttemptsForExam(examId) {
  const result = await pool.query(
    `
    SELECT a.*, u.username, u.full_name
    FROM exam_attempts a
    JOIN users u ON u.id = a.user_id
    WHERE a.exam_id = $1
    ORDER BY a.created_at DESC
    `,
    [examId]
  );
  return result.rows;
}

// Full breakdown of one student's attempt: every question, the
// answer they gave (or their coding submission), whether it was
// correct, and points awarded — everything the admin needs to see
// exactly what the student did.
export async function getAttemptDetailForAdmin(attemptId) {
  const attemptResult = await pool.query(
    `
    SELECT a.*, u.username, u.full_name
    FROM exam_attempts a
    JOIN users u ON u.id = a.user_id
    WHERE a.id = $1
    `,
    [attemptId]
  );
  const attempt = attemptResult.rows[0];
  if (!attempt) return null;

  const questions = await getExamQuestionsForAdmin(attempt.exam_id);
  const answers = await getAttemptAnswers(attemptId);
  const codingSubmissions = await pool.query(
    `
    SELECT DISTINCT ON (eq.id)
      eq.id AS exam_question_id, sub.id AS submission_id, sub.source_code,
      sub.language, sub.status, sub.passed_tests, sub.total_tests, sub.xp_earned
    FROM exam_questions eq
    JOIN submissions sub
      ON sub.challenge_id = eq.challenge_id
     AND sub.exam_attempt_id = $1
    WHERE eq.type = 'coding'
    ORDER BY eq.id, sub.created_at DESC
    `,
    [attemptId]
  );

  const details = questions.map((q) => {
    if (q.type === "coding") {
      const submission = codingSubmissions.rows.find((s) => s.exam_question_id === q.id);
      return {
        questionId: q.id,
        type: q.type,
        question: q.challenge_title,
        points: q.points,
        pointsAwarded: submission?.status === "accepted" ? q.points : 0,
        studentSourceCode: submission?.source_code || null,
        studentLanguage: submission?.language || null,
        score: submission ? `${submission.passed_tests}/${submission.total_tests}` : "0/0",
        status: submission?.status || "not_attempted",
      };
    }

    const answer = answers.find((a) => a.exam_question_id === q.id);
    return {
      questionId: q.id,
      type: q.type,
      question: q.question,
      points: q.points,
      pointsAwarded: answer?.points_awarded || 0,
      correctAnswer: q.data,
      studentAnswer: answer?.answer ?? null,
      isCorrect: answer?.is_correct ?? null,
      status: answer ? "answered" : "not_attempted",
    };
  });

  return {
    attempt: {
      id: attempt.id,
      status: attempt.status,
      totalScore: attempt.total_score,
      maxScore: attempt.max_score,
      startedAt: attempt.started_at,
      submittedAt: attempt.submitted_at,
      student: { id: attempt.user_id, name: attempt.full_name, username: attempt.username },
    },
    questions: details,
  };
}

// Score already-recorded coding submissions that belong to this
// attempt (read-only join into the existing submissions table —
// nothing about how submissions are created is changed).
export async function getAttemptCodingScore(examAttemptId) {
  const result = await pool.query(
    `
    SELECT s.exam_question_id, s.xp_earned, s.status
    FROM (
      SELECT DISTINCT ON (eq.id) eq.id AS exam_question_id, sub.status, sub.xp_earned, sub.created_at
      FROM exam_questions eq
      JOIN submissions sub
        ON sub.challenge_id = eq.challenge_id
       AND sub.exam_attempt_id = $1
      WHERE eq.type = 'coding'
      ORDER BY eq.id, sub.created_at DESC
    ) s
    `,
    [examAttemptId]
  );
  return result.rows;
}