export function validateCreateStudent(req, res, next) {
  const { username, password, email, fullName } = req.body;

  if (!username || typeof username !== "string" || username.trim().length < 3) {
    return res.status(400).json({ message: "Username must be at least 3 characters" });
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ message: "A valid email is required" });
  }

  if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
    return res.status(400).json({ message: "Full name is required" });
  }

  next();
}