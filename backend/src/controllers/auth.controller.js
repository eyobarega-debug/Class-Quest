import bcrypt from "bcryptjs";
import {
  findUserByUsername,
  findUserById,
  formatUser,
} from "../models/user.model.js";
import { generateToken } from "../utils/jwt.js";

export async function login(req, res) {
  const { username, password } = req.body;

  const user = await findUserByUsername(username);

  if (!user) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  if (user.is_active === false) {
    return res.status(403).json({ message: "This account has been disabled. Contact your admin." });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = generateToken(user);

  res.json({
    message: "Login successful",
    token,
    user: formatUser(user),
  });
}

export async function getCurrentUser(req, res) {
  const user = await findUserById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({ user: formatUser(user) });
}