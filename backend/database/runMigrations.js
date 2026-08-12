// Runs every .sql file in database/migrations, in filename order.
// Usage: npm run migrate   (run from inside backend/)
//
// This is intentionally simple: no migration framework, no
// up/down tracking table. For a 30-50 person class project,
// "run these SQL files in order" is easier to understand and
// debug than a full migration library. You can upgrade to one
// later if the project grows.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '..', '..', 'database', 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // "001_..." runs before "002_..."

  console.log(`Found ${files.length} migration file(s).`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Running ${file} ...`);
    await pool.query(sql);
    console.log(`  done.`);
  }

  console.log('All migrations completed.');
  await pool.end();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
