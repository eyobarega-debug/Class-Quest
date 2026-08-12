// Creates one admin account + a few demo students so you have
// something to log in with immediately after migrating.
// Usage (from backend/):  npm run seed
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', 'backend', '.env') });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const USERS = [
  { name: 'Admin', email: 'admin@classquest.local', username: 'admin', password: 'AdminPass123', role: 'admin' },
  { name: 'Eyob Arega', email: 'eyob@classquest.local', username: 'eyob', password: 'StudentPass123', role: 'student', xp: 2310, rating: 1420, streak: 12 },
  { name: 'Abel Tesfaye', email: 'abel@classquest.local', username: 'abel', password: 'StudentPass123', role: 'student', xp: 2450, rating: 1500, streak: 9 },
  { name: 'Hana Kebede', email: 'hana@classquest.local', username: 'hana', password: 'StudentPass123', role: 'student', xp: 2080, rating: 1360, streak: 5 },
];

async function seed() {
  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO users (name, email, username, password_hash, role, xp, rating, streak)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO NOTHING`,
      [u.name, u.email, u.username, passwordHash, u.role, u.xp || 0, u.rating || 1000, u.streak || 0]
    );
    console.log(`Seeded ${u.role}: ${u.username} / ${u.password}`);
  }
  await pool.end();
  console.log('\nDone. You can now log in with any of the accounts above.');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
