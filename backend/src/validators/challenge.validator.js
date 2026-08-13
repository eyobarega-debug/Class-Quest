export function validateCreateChallenge(req, res, next) {
  const { title, description, difficulty, languages } = req.body;

  if (!title || typeof title !== "string" || title.trim().length < 3) {
    return res.status(400).json({ message: "Title must be at least 3 characters" });
  }

  if (!description || typeof description !== "string" || description.trim().length < 10) {
    return res.status(400).json({ message: "Description must be at least 10 characters" });
  }

  const allowedDifficulties = ["easy", "medium", "hard"];
  if (!allowedDifficulties.includes(difficulty)) {
    return res.status(400).json({ message: "Difficulty must be easy, medium, or hard" });
  }

  if (!Array.isArray(languages) || languages.length === 0) {
    return res.status(400).json({
      message: "At least one language with starter code is required",
    });
  }

  next();
}

export function validateSubmission(req, res, next) {
  const { language, sourceCode } = req.body;

  if (!language || typeof language !== "string") {
    return res.status(400).json({ message: "Language is required" });
  }

  if (!sourceCode || typeof sourceCode !== "string" || sourceCode.trim().length === 0) {
    return res.status(400).json({ message: "Source code is required" });
  }

  next();
}