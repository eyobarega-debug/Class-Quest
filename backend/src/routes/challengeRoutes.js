import express from "express";
import {
  getChallenges,
  getChallengeDetail,
  postChallenge,
  patchChallenge,
  removeChallenge,
  runCode,
  submitCode,
} from "../controllers/challenge.controller.js";
import { validateCreateChallenge, validateSubmission } from "../validators/challenge.validator.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/", authenticate, asyncHandler(getChallenges));
router.get("/:slug", authenticate, asyncHandler(getChallengeDetail));

router.post("/", authenticate, requireAdmin, validateCreateChallenge, asyncHandler(postChallenge));
router.patch("/:id", authenticate, requireAdmin, asyncHandler(patchChallenge));
router.delete("/:id", authenticate, requireAdmin, asyncHandler(removeChallenge));

router.post("/:slug/run", authenticate, validateSubmission, asyncHandler(runCode));
router.post("/:slug/submit", authenticate, validateSubmission, asyncHandler(submitCode));

export default router;