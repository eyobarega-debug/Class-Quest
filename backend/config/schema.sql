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