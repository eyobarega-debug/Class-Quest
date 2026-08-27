// backend/src/routes/challengeRoutes.js
import express from "express";
import {
  getChallenges,
  getChallengeDetail,
  postChallenge,
  patchChallenge,
  removeChallenge,
  runCode,
  submitCode,
  getAllSubmissions,
  getSubmissionDetail,
  getActiveWeekHandler,
  setActiveWeekHandler,
} from "../controllers/challenge.controller.js";
import { validateCreateChallenge, validateSubmission } from "../validators/challenge.validator.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// --- Admin: view what students have submitted (source code + score
// "out of" the test cases, not XP). Must come before "/:slug" so
// "submissions" is never matched as a challenge slug. ---
router.get("/submissions", authenticate, requireAdmin, asyncHandler(getAllSubmissions));
router.get("/submissions/:id", authenticate, requireAdmin, asyncHandler(getSubmissionDetail));

// --- Active week (which week's challenges students see by default).
// Also registered before "/:slug" for the same reason as above. ---
router.get("/active-week", authenticate, asyncHandler(getActiveWeekHandler));
router.patch("/active-week", authenticate, requireAdmin, asyncHandler(setActiveWeekHandler));

router.get("/", authenticate, asyncHandler(getChallenges));
router.get("/:slug", authenticate, asyncHandler(getChallengeDetail));

router.post("/", authenticate, requireAdmin, validateCreateChallenge, asyncHandler(postChallenge));
router.patch("/:id", authenticate, requireAdmin, asyncHandler(patchChallenge));
router.delete("/:id", authenticate, requireAdmin, asyncHandler(removeChallenge));

router.post("/:slug/run", authenticate, validateSubmission, asyncHandler(runCode));
router.post("/:slug/submit", authenticate, validateSubmission, asyncHandler(submitCode));

export default router;