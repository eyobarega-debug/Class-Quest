export function validateLogin(req, res, next) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password are required",
    });
  }

  if (typeof username !== "string") {
    return res.status(400).json({
      message: "Username must be text",
    });
  }

  if (typeof password !== "string") {
    return res.status(400).json({
      message: "Password must be text",
    });
  }

  next();
}