import express from "express";
import {
  getStudents,
  createStudent,
  updateStudentStatus,
} from "../controllers/user.controller.js";
import { validateCreateStudent } from "../validators/user.validator.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// Every route here is admin-only: no public registration.
router.use(authenticate, requireAdmin);

router.get("/", asyncHandler(getStudents));
router.post("/", validateCreateStudent, asyncHandler(createStudent));
router.put("/:id/status", asyncHandler(updateStudentStatus));

export default router;