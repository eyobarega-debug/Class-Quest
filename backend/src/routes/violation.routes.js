import express from "express";

import {
  startTestSession,
  reportViolation,
  finishTestSession,
  getViolationsForSession,
  getViolations,
} from "../controllers/violation.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

// ===============================
// STUDENT ROUTES
// ===============================

// Start monitoring session
router.post(
  "/sessions/start",
  authenticate,
  startTestSession
);

// Report violation
router.post(
  "/report",
  authenticate,
  reportViolation
);

// Finish monitoring session
router.post(
  "/sessions/finish",
  authenticate,
  finishTestSession
);

// ===============================
// ADMIN ROUTES
// ===============================

// Get all violations
router.get(
  "/",
  authenticate,
  requireAdmin,
  getViolations
);

// Get violations for one session
router.get(
  "/session/:sessionId",
  authenticate,
  requireAdmin,
  getViolationsForSession
);

export default router;