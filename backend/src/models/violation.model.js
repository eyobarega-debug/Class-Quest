import pool from "../config/db.js";

const EVENT_SEVERITIES = {
  TAB_SWITCH: "medium",
  WINDOW_BLUR: "medium",
  APPLICATION_SWITCH: "medium",
  FULLSCREEN_EXIT: "high",
  COPY: "medium",
  PASTE: "medium",
  REFRESH: "high",
  NAVIGATION: "high",
  TASK_MANAGER_OPENED: "critical",
  UNKNOWN_APPLICATION: "high",
};


// Create a test monitoring session
export async function createTestSession({
  userId,
  challengeId,
}) {
  const result = await pool.query(
    `
    INSERT INTO test_sessions
      (user_id, challenge_id)
    VALUES ($1, $2)
    RETURNING *
    `,
    [userId, challengeId]
  );

  return result.rows[0];
}


// Get active session for a student
export async function getActiveTestSession({
  userId,
  challengeId,
}) {
  const result = await pool.query(
    `
    SELECT *
    FROM test_sessions
    WHERE user_id = $1
      AND challenge_id = $2
      AND status = 'active'
    ORDER BY started_at DESC
    LIMIT 1
    `,
    [userId, challengeId]
  );

  return result.rows[0] || null;
}


// Record a violation
export async function createViolation({
  sessionId,
  userId,
  challengeId,
  eventType,
  applicationName,
  windowTitle,
  details,
}) {
  const severity =
    EVENT_SEVERITIES[eventType] || "medium";

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const violationResult = await client.query(
      `
      INSERT INTO test_violations
        (
          session_id,
          user_id,
          challenge_id,
          event_type,
          severity,
          application_name,
          window_title,
          details
        )
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [
        sessionId,
        userId,
        challengeId,
        eventType,
        severity,
        applicationName || null,
        windowTitle || null,
        details || {},
      ]
    );

    await client.query(
      `
      UPDATE test_sessions
      SET violation_count = violation_count + 1
      WHERE id = $1
      `,
      [sessionId]
    );

    await client.query("COMMIT");

    return violationResult.rows[0];

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}


// End a test session
export async function endTestSession(
  sessionId,
  status = "completed"
) {
  const result = await pool.query(
    `
    UPDATE test_sessions
    SET
      status = $1,
      ended_at = NOW()
    WHERE id = $2
    RETURNING *
    `,
    [status, sessionId]
  );

  return result.rows[0] || null;
}


// Get violations for one session
export async function getSessionViolations(
  sessionId
) {
  const result = await pool.query(
    `
    SELECT
      tv.*,
      u.username,
      c.title AS challenge_title
    FROM test_violations tv
    JOIN users u
      ON u.id = tv.user_id
    JOIN challenges c
      ON c.id = tv.challenge_id
    WHERE tv.session_id = $1
    ORDER BY tv.created_at ASC
    `,
    [sessionId]
  );

  return result.rows;
}


// Admin: get recent violations
export async function getRecentViolations({
  limit = 100,
  offset = 0,
} = {}) {
  const result = await pool.query(
    `
    SELECT
      tv.*,
      u.username,
      c.title AS challenge_title
    FROM test_violations tv
    JOIN users u
      ON u.id = tv.user_id
    JOIN challenges c
      ON c.id = tv.challenge_id
    ORDER BY tv.created_at DESC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );

  return result.rows;
}