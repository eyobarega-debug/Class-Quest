import express from "express";
import { login, register, getCurrentUser } from "../controllers/auth.controller.js";
import { validateLogin, validateRegister } from "../validators/auth.validator.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { loginLimiter } from "../middleware/rateLimit.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.post("/login", loginLimiter, validateLogin, asyncHandler(login));
router.post("/register", loginLimiter, validateRegister, asyncHandler(register));

router.get("/me", authenticate, asyncHandler(getCurrentUser));

export default router;