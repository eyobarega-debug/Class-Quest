const express = require('express');

const {
  createExam,
  getExams,
  getExam,
  updateExam,
  verifyPassword,
  startExam,
} = require('../controllers/examController');

const {
  requireAuth,
  requireAdmin,
} = require('../middleware/authMiddleware');

const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();


// ======================================================
// STUDENT / AUTHENTICATED USER
// Get all exams
// GET /api/exams
// ======================================================

router.get(
  '/',
  requireAuth,
  asyncHandler(getExams)
);


// ======================================================
// ADMIN
// Create exam
// POST /api/exams
// ======================================================

router.post(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(createExam)
);

// Flat feed of every exam answer across every exam, for the
// "Submissions" dashboard. Must be registered before "/:id" so
// "answers" is never matched as an exam id.
router.get("/answers", authenticate, requireAdmin, asyncHandler(getAllExamAnswers));

// ======================================================
// AUTHENTICATED USER
// Get one exam
// GET /api/exams/:id
// ======================================================

router.get(
  '/:id',
  requireAuth,
  asyncHandler(getExam)
);


// ======================================================
// ADMIN
// Update exam
// PUT /api/exams/:id
// ======================================================

router.put(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(updateExam)
);


// ======================================================
// STUDENT
// Verify exam password
// POST /api/exams/:id/verify-password
// ======================================================

router.post(
  '/:id/verify-password',
  requireAuth,
  asyncHandler(verifyPassword)
);


// ======================================================
// STUDENT
// Start exam
// POST /api/exams/:id/start
// ======================================================

router.post(
  '/:id/start',
  requireAuth,
  asyncHandler(startExam)
);


module.exports = router;