const express = require('express');
const { run, submit, submitAnswer } = require('../controllers/submissionController');
const { requireAuth } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Existing Coding Submission Routes (UNCHANGED)
router.post('/run', requireAuth, asyncHandler(run));
router.post('/submit', requireAuth, asyncHandler(submit));

// New Non-Coding Question Route (MCQ, True/False, Short Answer)
router.post('/submit-answer', requireAuth, asyncHandler(submitAnswer));

module.exports = router;