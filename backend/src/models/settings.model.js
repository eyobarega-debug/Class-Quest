import pool from "../config/db.js";

export async function getSetting(key) {
  const result = await pool.query(
    `SELECT value FROM app_settings WHERE key = $1`,
    [key]
  );
  return result.rows[0]?.value ?? null;
}

export async function setSetting(key, value) {
  const result = await pool.query(
    `INSERT INTO app_settings (key, value)
     VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
     RETURNING value`,
    [key, value]
  );
  return result.rows[0]?.value ?? null;
}

// ============================================================
// ACTIVE WEEK
// The week number students see by default on the Coding Arena, and
// the week a "reset season XP" action is understood to correspond to.
// ============================================================
export async function getActiveWeek() {
  const value = await getSetting("active_week");
  const week = Number(value);
  return Number.isInteger(week) ? week : 1;
}

export async function setActiveWeek(week) {
  const value = await setSetting("active_week", String(week));
  return Number(value);
}