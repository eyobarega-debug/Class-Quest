// ------------------------------------------------------------------
// All SQL for challenges lives here. The single most important rule
// in this file: hidden test cases are filtered out in JavaScript
// (see stripHidden below) before anything is returned to a student-
// facing controller. Admin-only functions are the only ones that
// see is_hidden=true rows.
// ------------------------------------------------------------------
const pool = require('../config/db');

function stripHidden(testCases) {
  return testCases
    .filter((tc) => !tc.is_hidden)
    .map((tc) => ({ id: tc.id, input: tc.input, expectedOutput: tc.expected_output }));
}

function shapeTestCase(tc) {
  return {
    id: tc.id,
    input: tc.input,
    expectedOutput: tc.expected_output,
    isHidden: tc.is_hidden,
  };
}

function shapeLanguage(row) {
  return { language: row.language, starterCode: row.starter_code };
}

function shapeChallengeSummary(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    difficulty: row.difficulty,
    category: row.category,
    xpReward: row.xp_reward,
    tags: row.tags,
    languages: row.languages  [],
  };
}

// -------------------- LIST (Coding Arena grid) --------------------
async function listChallenges({ language, difficulty, category, search, limit = 50, offset = 0 }) {
  const conditions = ['c.is_published = true'];
  const params = [];

  if (language) {
    params.push(language);
    conditions.push(`EXISTS (
      SELECT 1 FROM challenge_languages cl
      WHERE cl.challenge_id = c.id AND cl.language = $${params.length}
    )`);
  }
  if (difficulty) {
    params.push(difficulty);
    conditions.push(`c.difficulty = $${params.length}`);
  }
  if (category) {
    params.push(category);
    conditions.push(`c.category = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`c.title ILIKE $${params.length}`);
  }

  params.push(limit);
  params.push(offset);

  const { rows } = await pool.query(
    `SELECT c.id, c.title, c.slug, c.difficulty, c.category, c.xp_reward, c.tags,
            COALESCE(
              ARRAY_AGG(cl.language::text) FILTER (WHERE cl.language IS NOT NULL),
              '{}'
            ) AS languages
     FROM challenges c
     LEFT JOIN challenge_languages cl ON cl.challenge_id = c.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY c.id
     ORDER BY c.id ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return rows.map(shapeChallengeSummary);
}

// -------------------- GET ONE (student view - no hidden tests) --------------------
async function getChallengeForStudent(idOrSlug) {
  const challenge = await getRawChallenge(idOrSlug);
  if (!challenge) return null;

  const languages = await getLanguages(challenge.id);
  const testCases = await getTestCases(challenge.id);

  return {
    id: challenge.id,
    title: challenge.title,
    slug: challenge.slug,
    description: challenge.description,
    difficulty: challenge.difficulty,
    category: challenge.category,
    xpReward: challenge.xp_reward,
    timeLimitMs: challenge.time_limit_ms,
    memoryLimitKb: challenge.memory_limit_kb,
    constraints: challenge.constraints,
    examples: challenge.examples,
    tags: challenge.tags,
    languages: languages.map(shapeLanguage),
    // Only PUBLIC test cases - hidden ones never leave the server
    // before a submission is graded (that grading happens in Phase 3).
    sampleTestCases: stripHidden(testCases),
  };
}

// -------------------- GET ONE (admin view - includes hidden tests) --------------------
async function getChallengeForAdmin(idOrSlug) {
  const challenge = await getRawChallenge(idOrSlug);
  if (!challenge) return null;

  const languages = await getLanguages(challenge.id);
  const testCases = await getTestCases(challenge.id);

  return {
    id: challenge.id,
    title: challenge.title,
    slug: challenge.slug,
    description: challenge.description,
    difficulty: challenge.difficulty,
    category: challenge.category,
    xpReward: challenge.xp_reward,
    timeLimitMs: challenge.time_limit_ms,
    memoryLimitKb: challenge.memory_limit_kb,
    constraints: challenge.constraints,
    examples: challenge.examples,
    tags: challenge.tags,
    isPublished: challenge.is_published,
    languages: languages.map(shapeLanguage),
    testCases: testCases.map(shapeTestCase), // includes hidden ones
  };
}

async function getRawChallenge(idOrSlug) {
  const isNumeric = /^\d+$/.test(String(idOrSlug));
  const { rows } = await pool.query(
    `SELECT * FROM challenges WHERE ${isNumeric ? 'id = $1' : 'slug = $1'} LIMIT 1`,
    [idOrSlug]
  );
  return rows[0]  null;
}

async function getLanguages(challengeId) {
  const { rows } = await pool.query(
    SELECT language, starter_code FROM challenge_languages WHERE challenge_id = $1 ORDER BY language,
    [challengeId]
  );
  return rows;
}

async function getTestCases(challengeId) {
  const { rows } = await pool.query(
    SELECT * FROM test_cases WHERE challenge_id = $1 ORDER BY order_index ASC, id ASC,
    [challengeId]
  );
  return rows;
}

// -------------------- CREATE --------------------
// Inserts the challenge, its per-language starter code, and its
// test cases together in a transaction: either all of it saves, or
// none of it does (e.g. if a language enum value is invalid, we
// don't want a half-created challenge with no test cases).
async function createChallenge(data, adminId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO challenges
        (title, slug, description, difficulty, category, xp_reward,
         time_limit_ms, memory_limit_kb, constraints, examples, tags, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [
        data.title, data.slug, data.description, data.difficulty, data.category,
        data.xpReward, data.timeLimitMs, data.memoryLimitKb, data.constraints  null,
        JSON.stringify(data.examples  []), data.tags  [], adminId,
      ]
    );
    const challengeId = rows[0].id;

    for (const lang of data.languages) {
      await client.query(
        `INSERT INTO challenge_languages (challenge_id, language, starter_code) VALUES ($1,$2,$3)`,
        [challengeId, lang.language, lang.starterCode  '']
      );
    }

    let order = 0;
    for (const tc of data.testCases) {
      await client.query(
        `INSERT INTO test_cases (challenge_id, input, expected_output, is_hidden, order_index)
         VALUES ($1,$2,$3,$4,$5)`,
        [challengeId, tc.input, tc.expectedOutput, !!tc.isHidden, order++]
      );
    }

    await client.query('COMMIT');
    return challengeId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// -------------------- UPDATE --------------------
// Simplest correct approach for a class-sized admin tool: update the
// challenge row, then fully replace its languages and test cases.
// Avoids diffing logic that's easy to get subtly wrong.
async function updateChallenge(id, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE challenges SET
         title=$2, description=$3, difficulty=$4, category=$5, xp_reward=$6,
         time_limit_ms=$7, memory_limit_kb=$8, constraints=$9, examples=$10,
         tags=$11, is_published=$12
       WHERE id=$1`,
      [
        id, data.title, data.description, data.difficulty, data.category,
        data.xpReward, data.timeLimitMs, data.memoryLimitKb, data.constraints  null,
        JSON.stringify(data.examples  []), data.tags  [], data.isPublished !== false,
      ]
    );

    await client.query(`DELETE FROM challenge_languages WHERE challenge_id = $1`, [id]);
    for (const lang of data.languages) {
      await client.query(
        `INSERT INTO challenge_languages (challenge_id, language, starter_code) VALUES ($1,$2,$3)`,
        [id, lang.language, lang.starterCode  '']
      );
    }
    await client.query(DELETE FROM test_cases WHERE challenge_id = $1, [id]);
    let order = 0;
    for (const tc of data.testCases) {
      await client.query(
        `INSERT INTO test_cases (challenge_id, input, expected_output, is_hidden, order_index)
         VALUES ($1,$2,$3,$4,$5)`,
        [id, tc.input, tc.expectedOutput, !!tc.isHidden, order++]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteChallenge(id) {
  await pool.query(`DELETE FROM challenges WHERE id = $1`, [id]); // cascades to languages/test_cases
}

async function slugExists(slug, excludeId = null) {
  const { rows } = excludeId
    ? await pool.query(SELECT id FROM challenges WHERE slug = $1 AND id != $2, [slug, excludeId])
    : await pool.query(SELECT id FROM challenges WHERE slug = $1, [slug]);
  return rows.length > 0;
}

// Used ONLY by the submission grading pipeline (submissionController.js),
// server-side, to actually run the code against every test case
// including hidden ones. The grading result sent back to the client
// still must never include hidden inputs/expected outputs verbatim -
// see submissionController.js for where that's enforced.
async function getTestCasesForGrading(challengeId) {
  const testCases = await getTestCases(challengeId);
  return testCases.map(shapeTestCase); // { id, input, expectedOutput, isHidden }
}

module.exports = {
  listChallenges,
  getChallengeForStudent,
  getChallengeForAdmin,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  slugExists,
  getTestCasesForGrading,
};