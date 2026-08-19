export function validateCreateExam(req, res, next) {
  const { title, durationMinutes, password } = req.body;

  if (!title || typeof title !== "string" || title.trim().length < 3) {
    return res.status(400).json({ message: "Title must be at least 3 characters" });
  }

  if (!Number.isFinite(Number(durationMinutes)) || Number(durationMinutes) <= 0) {
    return res.status(400).json({ message: "Duration must be a number greater than zero" });
  }

  if (password !== undefined && password !== null && password !== "" && String(password).length < 4) {
    return res.status(400).json({ message: "Exam password must be at least 4 characters" });
  }

  next();
}

export function validateExamPatch(req, res, next) {
  const { durationMinutes } = req.body;

  if (durationMinutes !== undefined && (!Number.isFinite(Number(durationMinutes)) || Number(durationMinutes) <= 0)) {
    return res.status(400).json({ message: "Duration must be a number greater than zero" });
  }

  next();
}

export function validateExamPassword(req, res, next) {
  const { password } = req.body;

  if (password !== undefined && password !== null && password !== "" && String(password).length < 4) {
    return res.status(400).json({ message: "Exam password must be at least 4 characters" });
  }

  next();
}

const ALLOWED_TYPES = ["mcq", "true_false", "short_answer", "coding"];

export function validateCreateExamQuestion(req, res, next) {
  const { type, question, points, options, correctOption, correctAnswer, expectedAnswer, challengeId } = req.body;

  if (!ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({ message: "Question type must be mcq, true_false, short_answer, or coding" });
  }

  if (points !== undefined && (!Number.isFinite(Number(points)) || Number(points) <= 0)) {
    return res.status(400).json({ message: "Points must be a number greater than zero" });
  }

  if (type === "coding") {
    if (!challengeId) {
      return res.status(400).json({ message: "challengeId is required for coding questions" });
    }
    return next();
  }

  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return res.status(400).json({ message: "Question text is required" });
  }

  if (type === "mcq") {
    if (!Array.isArray(options) || options.length < 2 || options.some((o) => !o || !String(o).trim())) {
      return res.status(400).json({ message: "MCQ requires at least 2 non-empty options" });
    }
    if (!correctOption || !options.includes(correctOption)) {
      return res.status(400).json({ message: "correctOption must match one of the provided options" });
    }
  }

  if (type === "true_false" && correctAnswer === undefined) {
    return res.status(400).json({ message: "correctAnswer (true/false) is required" });
  }

  if (type === "short_answer" && (!expectedAnswer || !String(expectedAnswer).trim())) {
    return res.status(400).json({ message: "expectedAnswer is required" });
  }

  next();
}

// Bulk import: only checks the shape (must be a non-empty array of
// objects). Per-question validation happens in the controller so a
// single bad row can name itself in the error message.
export function validateBulkExamQuestions(req, res, next) {
  const { questions } = req.body;

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: "questions must be a non-empty array" });
  }

  if (questions.length > 100) {
    return res.status(400).json({ message: "Cannot add more than 100 questions at once" });
  }

  next();
}