// A "pool" keeps a set of already-open PostgreSQL connections ready
// to reuse, instead of opening a brand-new connection for every
// request (which would be slow). Every file that needs the database
// imports this same pool.
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  // A background/idle client crashed. Log it, don't crash the server.
  console.error('Unexpected error on idle PostgreSQL client', err);
});

// Auto-create required database tables on startup
const initDb = async () => {
  try {
    // 1. Question Bank (MCQ, True/False, Short Answer, Coding)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        prompt TEXT,
        type VARCHAR(50) NOT NULL DEFAULT 'coding',
        difficulty VARCHAR(20) DEFAULT 'easy',
        category VARCHAR(100),
        points INT DEFAULT 10,
        options JSONB,
        correct_answer TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. Exams Table (Timer duration & password access)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exams (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        duration_minutes INT NOT NULL DEFAULT 60,
        password VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 3. Exam Questions Junction Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exam_questions (
        id SERIAL PRIMARY KEY,
        exam_id INT REFERENCES exams(id) ON DELETE CASCADE,
        question_id INT REFERENCES questions(id) ON DELETE CASCADE,
        order_index INT DEFAULT 0
      );
    `);

    // 4. Exam Attempts Table (Tracks student timer start/submission)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exam_attempts (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        exam_id INT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        started_at TIMESTAMP DEFAULT NOW(),
        submitted_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'IN_PROGRESS'
      );
    `);

    // 5. Student Answers Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_answers (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        attempt_id INT REFERENCES exam_attempts(id) ON DELETE CASCADE,
        submitted_answer TEXT,
        is_correct BOOLEAN DEFAULT false,
        points_earned INT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'SUBMITTED',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT unique_attempt_question UNIQUE (attempt_id, question_id)
      );
    `);

    console.log('Database tables verified successfully.');
  } catch (err) {
    console.error('Error initializing database tables:', err.message);
  }
};

initDb();

module.exports = pool;