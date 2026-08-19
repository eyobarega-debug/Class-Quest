import express from "express";
import {
  getExams,
  getExamDetail,
  postExam,
  patchExam,
  changeExamPassword,
  removeExam,
  postExamQuestion,
  postExamQuestionsBulk,
  patchExamQuestion,
  removeExamQuestion,
  verifyExamPassword,
  startExam,
  getAttemptStatus,
  answerExamQuestion,
  finishExam,
  getExamAttemptsForAdmin,
  getExamAttemptDetailForAdmin,
  getAllExamAnswers,
} from "../controllers/exam.controller.js";
import {
  validateCreateExam,
  validateExamPatch,
  validateExamPassword,
  validateCreateExamQuestion,
  validateBulkExamQuestions,
} from "../validators/exam.validator.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// --- Admin + student read access (student sees published only, no password) ---
router.get("/", authenticate, asyncHandler(getExams));

// Flat feed of every exam answer across every exam, for the
// "Submissions" dashboard. Must be registered before "/:id" so
// "answers" is never matched as an exam id.
router.get("/answers", authenticate, requireAdmin, asyncHandler(getAllExamAnswers));

router.get("/:id", authenticate, asyncHandler(getExamDetail));

// --- Admin: exam CRUD ---
router.post("/", authenticate, requireAdmin, validateCreateExam, asyncHandler(postExam));
router.patch("/:id", authenticate, requireAdmin, validateExamPatch, asyncHandler(patchExam));
router.patch("/:id/password", authenticate, requireAdmin, validateExamPassword, asyncHandler(changeExamPassword));
router.delete("/:id", authenticate, requireAdmin, asyncHandler(removeExam));

// --- Admin: exam questions ---
router.post("/:id/questions", authenticate, requireAdmin, validateCreateExamQuestion, asyncHandler(postExamQuestion));
// Bulk import (create many questions on one exam in a single call).
router.post("/:id/questions/bulk", authenticate, requireAdmin, validateBulkExamQuestions, asyncHandler(postExamQuestionsBulk));
router.patch("/:id/questions/:questionId", authenticate, requireAdmin, asyncHandler(patchExamQuestion));
router.delete("/:id/questions/:questionId", authenticate, requireAdmin, asyncHandler(removeExamQuestion));

// --- Admin: see what students have done on an exam ---
router.get("/:id/attempts", authenticate, requireAdmin, asyncHandler(getExamAttemptsForAdmin));
router.get("/attempts/:attemptId/admin", authenticate, requireAdmin, asyncHandler(getExamAttemptDetailForAdmin));

// --- Student: password gate, then start/take/finish ---
router.post("/:id/verify-password", authenticate, asyncHandler(verifyExamPassword));
router.post("/:id/start", authenticate, asyncHandler(startExam));
router.get("/attempts/:attemptId", authenticate, asyncHandler(getAttemptStatus));
router.post("/attempts/:attemptId/answers", authenticate, asyncHandler(answerExamQuestion));
router.post("/attempts/:attemptId/finish", authenticate, asyncHandler(finishExam));

export default router;