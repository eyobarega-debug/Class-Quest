export function validateLogin(req, res, next) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (typeof username !== "string") {
    return res.status(400).json({ message: "Username must be text" });
  }

  if (typeof password !== "string") {
    return res.status(400).json({ message: "Password must be text" });
  }

  next();
}

export function validateRegister(req, res, next) {
  const { username, email, password, fullName } = req.body;

  if (!username || typeof username !== "string" || username.trim().length < 3) {
    return res.status(400).json({ message: "Username must be at least 3 characters" });
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores" });
  }

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ message: "A valid email is required" });
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
    return res.status(400).json({ message: "Full name is required" });
  }

  next();
}