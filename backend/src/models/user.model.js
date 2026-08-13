import pool from "../config/db.js";
import { getXpProgress } from "../utils/levelSystem.js";

const SELECT_COLUMNS = `
  id, username, email, full_name, role, avatar_url,
  xp, rating, streak, is_active, created_at
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

export async function createUser({ username, email, passwordHash, fullName, role = "student" }) {
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

export async function listStudents({ limit = 200, offset = 0 } = {}) {
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
    `UPDATE users SET is_active = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING ${SELECT_COLUMNS}`,
    [id, isActive]
  );

  return result.rows[0] || null;
}

export async function addXp(userId, amount) {
  const result = await pool.query(
    `UPDATE users SET xp = xp + $2, updated_at = NOW()
     WHERE id = $1
     RETURNING ${SELECT_COLUMNS}`,
    [userId, amount]
  );

  return result.rows[0] || null;
}