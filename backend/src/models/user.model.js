import pool from "../config/db.js";
import { getXpProgress } from "../utils/levelSystem.js";

const SELECT_COLUMNS = `
  id, username, email, full_name, role, avatar_url,
  xp, lifetime_xp, rating, streak, is_active, created_at
`;

export function formatUser(user) {
  if (!user) return null;

  const progress = getXpProgress(user.xp || 0);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.full_name,
    role: user.role,
    avatarUrl: user.avatar_url,
    xp: user.xp || 0,
    lifetimeXp: user.lifetime_xp || 0,
    level: progress.level,
    xpIntoLevel: progress.xpIntoLevel,
    xpForNextLevel: progress.xpForNextLevel,
    xpPercent: progress.percent,
    rating: user.rating,
    streak: user.streak,
    isActive: user.is_active,
    createdAt: user.created_at,
  };
}

export async function findUserByUsername(username) {
  const result = await pool.query(
    `
    SELECT id, username, email, password_hash, full_name, role, avatar_url,
           xp, rating, streak, is_active, created_at
    FROM users
    WHERE username = $1
    `,
    [username]
  );

  return result.rows[0];
}

export async function findUserById(id) {
  const result = await pool.query(
    `SELECT ${SELECT_COLUMNS} FROM users WHERE id = $1`,
    [id]
  );

  return result.rows[0];
}

export async function emailOrUsernameTaken(email, username) {
  const result = await pool.query(
    `SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1`,
    [email.toLowerCase(), username]
  );

  return result.rows.length > 0;
}

export async function createUser({
  username,
  email,
  passwordHash,
  fullName,
  role = "student",
}) {
  const result = await pool.query(
    `
    INSERT INTO users (username, email, password_hash, full_name, role)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING ${SELECT_COLUMNS}
    `,
    [username, email.toLowerCase(), passwordHash, fullName, role]
  );

  return result.rows[0];
}

// ============================================================
// ADMIN: RESET A USER'S PASSWORD
// ============================================================
export async function setPasswordHash(userId, passwordHash) {
  const result = await pool.query(
    `
    UPDATE users
    SET password_hash = $1
    WHERE id = $2
    RETURNING ${SELECT_COLUMNS}
    `,
    [passwordHash, userId]
  );

  return result.rows[0] || null;
}

export async function listStudents({
  limit = 200,
  offset = 0,
} = {}) {
  const result = await pool.query(
    `
    SELECT ${SELECT_COLUMNS} FROM users
    WHERE role = 'student'
    ORDER BY xp DESC, full_name ASC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );

  return result.rows;
}

export async function setActive(id, isActive) {
  const result = await pool.query(
    `UPDATE users
     SET is_active = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING ${SELECT_COLUMNS}`,
    [id, isActive]
  );

  return result.rows[0] || null;
}


// Ranked by XP (ties broken by rating). Solved count is distinct
// challenges with at least one accepted submission. Used by the
// Coding Arena leaderboard.
// orderBy: "xp" (default) ranks by the CURRENT/resettable total — this
// is the weekly/competition leaderboard. "lifetime_xp" ranks by the
// permanent running total that survives every reset.
export async function getLeaderboard(limit = 50, orderBy = "xp") {
  const column = orderBy === "lifetime_xp" ? "lifetime_xp" : "xp";

  const result = await pool.query(
    `
    SELECT
      u.id, u.username, u.full_name, u.avatar_url,
      u.xp, u.lifetime_xp, u.rating, u.streak,
      COUNT(DISTINCT s.challenge_id) FILTER (WHERE s.status = 'accepted') AS solved_count
    FROM users u
    LEFT JOIN submissions s ON s.user_id = u.id
    WHERE u.role = 'student' AND u.is_active = true
    GROUP BY u.id
    ORDER BY u.${column} DESC, u.rating DESC, u.username ASC
    LIMIT $1
    `,
    [limit]
  );

  return result.rows;
}

// DELETE STUDENT
export async function deleteStudent(id) {
  const result = await pool.query(
    `DELETE FROM users
     WHERE id = $1
     AND role = 'student'
     RETURNING ${SELECT_COLUMNS}`,
    [id]
  );

  return result.rows[0] || null;
}

export async function addXp(userId, amount) {
  const result = await pool.query(
    `UPDATE users
     SET xp = xp + $2,
         lifetime_xp = lifetime_xp + $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING ${SELECT_COLUMNS}`,
    [userId, amount]
  );

  return result.rows[0] || null;
}

// ============================================================
// ADMIN: RESET A STUDENT'S CURRENT XP TO 0 (e.g. starting a new
// week/competition). Only zeroes "xp" — the column used for the
// live/current leaderboard and level display. "lifetime_xp" is
// intentionally left untouched, so it keeps accumulating across
// every reset and powers a separate All-Time leaderboard.
// ============================================================
export async function resetXp(userId) {
  const result = await pool.query(
    `UPDATE users
     SET xp = 0, updated_at = NOW()
     WHERE id = $1
     RETURNING ${SELECT_COLUMNS}`,
    [userId]
  );

  return result.rows[0] || null;
}