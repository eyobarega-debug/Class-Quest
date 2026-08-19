const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { authenticateToken, requireAdmin } = require('../middleware/auth'); // Adjust based on your auth middleware name

router.get('/', authenticateToken, questionController.getQuestions);

// POST /api/questions (Admin create non-coding question)
router.post('/', authenticateToken, requireAdmin, questionController.createQuestion);

module.exports = router;