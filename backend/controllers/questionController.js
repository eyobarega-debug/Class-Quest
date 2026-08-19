const pool = require('../config/db');

// GET /api/questions (Fetch all questions for the question bank)
exports.getQuestions = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM questions ORDER BY created_at DESC');
    return res.json({ questions: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/questions (Create MCQ, True/False, Short Answer, or Coding)
exports.createQuestion = async (req, res) => {
  try {
    const {
      title,
      prompt,
      question, // Fallback if sent as "question"
      type = 'coding',
      difficulty = 'easy',
      category = '',
      points = 10,
      options,
      correctAnswer,
    } = req.body;

    const questionText = prompt || question;

    // Validation for non-coding question types
    if (type !== 'coding') {
      if (!questionText) {
        return res.status(400).json({ error: 'Question prompt is required.' });
      }

      if (type === 'mcq' && (!options || !correctAnswer)) {
        return res.status(400).json({ error: 'MCQ options and correct answer are required.' });
      }

      if ((type === 'true_false' || type === 'short_answer') && !correctAnswer) {
        return res.status(400).json({ error: 'Correct answer is required.' });
      }
    }

    const newQuestion = await pool.query(
      `INSERT INTO questions (title, prompt, type, difficulty, category, points, options, correct_answer) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        title || '',
        questionText || '',
        type,
        difficulty,
        category,
        Number(points) || 10,
        options ? JSON.stringify(options) : null,
        correctAnswer || null,
      ]
    );

    return res.status(201).json(newQuestion.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};