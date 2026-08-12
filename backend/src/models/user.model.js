import pool from "../config/db.js";

export async function findUserByUsername(username) {
  const result = await pool.query(
    `
    SELECT
      id,
      username,
      email,
      password_hash,
      full_name,
      role,
      created_at
    FROM users
    WHERE username = $1
    `,
    [username]
  );

  return result.rows[0];
}

export async function findUserById(id) {
  const result = await pool.query(
    `
    SELECT
      id,
      username,
      email,
      full_name,
      role,
      created_at
    FROM users
    WHERE id = $1
    `,
    [id]
  );

  return result.rows[0];
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
    INSERT INTO users
      (username, email, password_hash, full_name, role)
    VALUES
      ($1, $2, $3, $4, $5)
    RETURNING
      id,
      username,
      email,
      full_name,
      role,
      created_at
    `,
    [
      username,
      email,
      passwordHash,
      fullName,
      role,
    ]
  );

  return result.rows[0];
}