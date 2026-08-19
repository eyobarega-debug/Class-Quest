import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import challengeRoutes from "./routes/challengeRoutes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import violationRoutes from "./routes/violation.routes.js";
import examRoutes from "./routes/examRoutes.js";


dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    message: "ClassQuest API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/violations", violationRoutes);
app.use("/api/exams", examRoutes);

app.use(errorHandler);

export default app;