import pool from "../config/db.js";

const CHALLENGE_LIST_COLUMNS = `
  id, title, slug, difficulty, category, tags, xp_reward, is_published, created_at
`;

// ============================================================
// CREATE CHALLENGE
// ============================================================
export async function createChallenge({
  title,
  slug,
  description,
  difficulty,
  category,
  tags = [],
  xpReward = 100,
  timeLimitMs = 2000,
  memoryLimitMb = 128,
  constraints,
  languages = [],
  testCases = [],
  createdBy,
  isPublished = true,
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const challengeResult = await client.query(
      `INSERT INTO challenges
        (
          title,
          slug,
          description,
          difficulty,
          category,
          tags,
          xp_reward,
          time_limit_ms,
          memory_limit_mb,
          constraints,
          created_by,
          is_published
        )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        title,
        slug,
        description,
        difficulty,
        category,
        tags,
        xpReward,
        timeLimitMs,
        memoryLimitMb,
        constraints,
        createdBy,
        isPublished,
      ]
    );

    const challenge = challengeResult.rows[0];

    // Add supported programming languages
    for (const lang of languages) {
      await client.query(
        `INSERT INTO challenge_languages
          (challenge_id, language, starter_code)
         VALUES ($1, $2, $3)`,
        [
          challenge.id,
          lang.language,
          lang.starterCode || "",
        ]
      );
    }

    // Add test cases
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];

      await client.query(
        `INSERT INTO test_cases
          (
            challenge_id,
            input,
            expected_output,
            is_hidden,
            order_index
          )
         VALUES ($1, $2, $3, $4, $5)`,
        [
          challenge.id,
          tc.input || "",
          tc.expectedOutput,
          Boolean(tc.isHidden),
          i,
        ]
      );
    }

    await client.query("COMMIT");

    return challenge;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ============================================================
// LIST CHALLENGES
// ============================================================
export async function listChallenges({
  difficulty,
  category,
  language,
  search,
  limit = 50,
  offset = 0,
} = {}) {
  const conditions = ["is_published = true"];
  const params = [];

  if (difficulty) {
    params.push(difficulty);
    conditions.push(`difficulty = $${params.length}`);
  }

  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`title ILIKE $${params.length}`);
  }

  let languageCondition = "";

  if (language) {
    params.push(language);

    languageCondition = `
      AND EXISTS (
        SELECT 1
        FROM challenge_languages cl
        WHERE cl.challenge_id = challenges.id
          AND cl.language = $${params.length}
      )
    `;
  }

  params.push(limit);
  params.push(offset);

  const result = await pool.query(
    `
      SELECT ${CHALLENGE_LIST_COLUMNS}
      FROM challenges
      WHERE ${conditions.join(" AND ")}
      ${languageCondition}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
    `,
    params
  );

  return result.rows;
}

// ============================================================
// GET CHALLENGE BY SLUG
// ============================================================
export async function getChallengeBySlug(slug) {
  const challengeResult = await pool.query(
    `SELECT * FROM challenges WHERE slug = $1`,
    [slug]
  );

  const challenge = challengeResult.rows[0];

  if (!challenge) {
    return null;
  }

  const languagesResult = await pool.query(
    `SELECT id, language, starter_code
     FROM challenge_languages
     WHERE challenge_id = $1
     ORDER BY language`,
    [challenge.id]
  );

  // Public tests only.
  // Hidden tests never leave this file through this function.
  const publicTestsResult = await pool.query(
    `SELECT id, input, expected_output
     FROM test_cases
     WHERE challenge_id = $1
       AND is_hidden = false
     ORDER BY order_index`,
    [challenge.id]
  );

  return {
    ...challenge,
    languages: languagesResult.rows,
    publicTests: publicTestsResult.rows,
  };
}

// ============================================================
// GET ALL TEST CASES
// Internal use only.
// Includes hidden tests.
// ============================================================
export async function getAllTestCases(challengeId) {
  const result = await pool.query(
    `SELECT id, input, expected_output, is_hidden
     FROM test_cases
     WHERE challenge_id = $1
     ORDER BY order_index`,
    [challengeId]
  );

  return result.rows;
}

// ============================================================
// GET CHALLENGE BY ID
// ============================================================
export async function getChallengeById(id) {
  const result = await pool.query(
    `SELECT * FROM challenges WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

// ============================================================
// UPDATE CHALLENGE
// ============================================================
const UPDATE_FIELD_MAP = {
  title: "title",
  description: "description",
  difficulty: "difficulty",
  category: "category",
  tags: "tags",
  xpReward: "xp_reward",
  constraints: "constraints",
  isPublished: "is_published",
};

export async function updateChallenge(id, fields) {
  const sets = [];
  const params = [];

  for (const [key, value] of Object.entries(fields)) {
    const column = UPDATE_FIELD_MAP[key];

    if (!column) {
      continue;
    }

    params.push(value);
    sets.push(`${column} = $${params.length}`);
  }

  if (sets.length === 0) {
    return getChallengeById(id);
  }

  params.push(id);

  const result = await pool.query(
    `UPDATE challenges
     SET ${sets.join(", ")},
         updated_at = NOW()
     WHERE id = $${params.length}
     RETURNING *`,
    params
  );

  return result.rows[0] || null;
}

// ============================================================
// DELETE CHALLENGE
// ============================================================
export async function deleteChallenge(id) {
  const result = await pool.query(
    `DELETE FROM challenges
     WHERE id = $1
     RETURNING id`,
    [id]
  );

  return result.rows.length > 0;
}

// ============================================================
// CREATE SUBMISSION
// ============================================================
export async function createSubmission({
  userId,
  challengeId,
  language,
  sourceCode,
  status,
  passedTests,
  totalTests,
  executionTimeMs,
  xpEarned,
  examAttemptId = null,
}) {
  const result = await pool.query(
    `INSERT INTO submissions
      (
        user_id,
        challenge_id,
        language,
        source_code,
        status,
        passed_tests,
        total_tests,
        execution_time_ms,
        xp_earned,
        exam_attempt_id
      )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      userId,
      challengeId,
      language,
      sourceCode,
      status,
      passedTests,
      totalTests,
      executionTimeMs,
      xpEarned,
      examAttemptId,
    ]
  );

  return result.rows[0];
}

// ============================================================
// ADMIN: LIST ALL SUBMISSIONS
// ============================================================
export async function listSubmissionsForAdmin({
  userId,
  challengeId,
  limit = 200,
  offset = 0,
} = {}) {
  const conditions = [];
  const params = [];

  if (userId) {
    params.push(userId);
    conditions.push(`s.user_id = $${params.length}`);
  }

  if (challengeId) {
    params.push(challengeId);
    conditions.push(`s.challenge_id = $${params.length}`);
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  params.push(limit);
  params.push(offset);

  const result = await pool.query(
    `
      SELECT
        s.*,
        u.username,
        u.full_name,
        c.title AS challenge_title,
        c.slug AS challenge_slug
      FROM submissions s
      JOIN users u ON u.id = s.user_id
      JOIN challenges c ON c.id = s.challenge_id
      ${where}
      ORDER BY s.created_at DESC
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
    `,
    params
  );

  return result.rows;
}

// ============================================================
// ADMIN: GET SUBMISSION BY ID
// ============================================================
export async function getSubmissionByIdForAdmin(id) {
  const result = await pool.query(
    `
      SELECT
        s.*,
        u.username,
        u.full_name,
        c.title AS challenge_title,
        c.slug AS challenge_slug
      FROM submissions s
      JOIN users u ON u.id = s.user_id
      JOIN challenges c ON c.id = s.challenge_id
      WHERE s.id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

// ============================================================
// CHECK IF USER ALREADY ACCEPTED CHALLENGE
// ============================================================
export async function hasAcceptedSubmission(userId, challengeId) {
  const result = await pool.query(
    `SELECT id
     FROM submissions
     WHERE user_id = $1
       AND challenge_id = $2
       AND status = 'accepted'
     LIMIT 1`,
    [userId, challengeId]
  );

  return result.rows.length > 0;
}

// ============================================================
// COUNT PRIOR SUBMISSION ATTEMPTS (any status) FOR THIS CHALLENGE
// ============================================================
export async function countSubmissionsForUserChallenge(userId, challengeId) {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM submissions
     WHERE user_id = $1
       AND challenge_id = $2`,
    [userId, challengeId]
  );

  return result.rows[0]?.count || 0;
}