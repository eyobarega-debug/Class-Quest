// ------------------------------------------------------------------
// This file is the ONLY place that writes SQL for the "users" table.
// Controllers call these functions instead of writing their own
// queries. That keeps SQL in one place, and (just as important)
// keeps every query parameterized ($1, $2, ...) so user input can
// never be concatenated into a query string - that's what prevents
// SQL injection.
// ------------------------------------------------------------------
const pool = require('../config/db');

// Columns that are safe to send to the frontend.
// Notably excludes password_hash.
const PUBLIC_COLUMNS = `
  id, name, email, username, role, avatar_url,
  xp, level, rating, streak, is_active, created_at
`;

async function findByEmailOrUsername(identifier) {
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE email = $1 OR username = $1 LIMIT 1`,
    [identifier.toLowerCase()]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function emailOrUsernameTaken(email, username) {
  const { rows } = await pool.query(
    `SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1`,
    [email.toLowerCase(), username]
  );
  return rows.length > 0;
}

async function createUser({ name, email, username, passwordHash, role = 'student' }) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, username, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${PUBLIC_COLUMNS}`,
    [name, email.toLowerCase(), username, passwordHash, role]
  );
  return rows[0];
}

async function listStudents({ limit = 100, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users
     WHERE role = 'student'
     ORDER BY xp DESC, name ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

async function setActive(id, isActive) {
  const { rows } = await pool.query(
    `UPDATE users SET is_active = $2 WHERE id = $1 RETURNING ${PUBLIC_COLUMNS}`,
    [id, isActive]
  );
  return rows[0] || null;
}

module.exports = {
  findByEmailOrUsername,
  findById,
  emailOrUsernameTaken,
  createUser,
  listStudents,
  setActive,
};
