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

router.post(
  "/sessions/start",
  authenticate,
  startTestSession
);

router.post(
  "/report",
  authenticate,
  reportViolation
);

router.post(
  "/sessions/finish",
  authenticate,
  finishTestSession
);


// ===============================
// ADMIN ROUTES
// ===============================

router.get(
  "/",
  authenticate,
  requireAdmin,
  getViolations
);

router.get(
  "/session/:sessionId",
  authenticate,
  requireAdmin,
  getViolationsForSession
);

export default router;