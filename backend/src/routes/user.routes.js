import express from "express";
import {
  getStudents,
  createStudent,
  updateStudentStatus,
  deleteStudent,
  getLeaderboardHandler,
  resetStudentPassword,
  resetStudentXp,
} from "../controllers/user.controller.js";

import { validateCreateStudent } from "../validators/user.validator.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// Any logged-in user (student or admin) can view the leaderboard.
// Must be registered before the admin-only gate below.
router.get("/leaderboard", authenticate, asyncHandler(getLeaderboardHandler));

// Every route below here is admin-only
router.use(authenticate, requireAdmin);

router.get("/", asyncHandler(getStudents));

router.post(
  "/",
  validateCreateStudent,
  asyncHandler(createStudent)
);

router.put(
  "/:id/status",
  asyncHandler(updateStudentStatus)
);

// RESET STUDENT PASSWORD (admin-only, inherited from router.use above)
router.put(
  "/:id/password",
  asyncHandler(resetStudentPassword)
);

// RESET STUDENT XP (admin-only, inherited from router.use above)
router.put(
  "/:id/xp/reset",
  asyncHandler(resetStudentXp)
);

// DELETE STUDENT
router.delete(
  "/:id",
  asyncHandler(deleteStudent)
);

export default router;