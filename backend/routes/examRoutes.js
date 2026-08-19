const express = require('express');
const { createExam, updateExam, verifyPassword, startExam } = require('../controllers/examController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Admin Exam Management
router.post('/', requireAuth, requireAdmin, asyncHandler(createExam));
router.put('/:id', requireAuth, requireAdmin, asyncHandler(updateExam));

// Student Exam Entry & Verification
router.post('/:id/verify-password', requireAuth, asyncHandler(verifyPassword));
router.post('/:id/start', requireAuth, asyncHandler(startExam));

module.exports = router;