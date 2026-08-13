import bcrypt from "bcryptjs";
import {
  findUserByUsername,
  findUserById,
  createUser,
  emailOrUsernameTaken,
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

export async function register(req, res) {
  const { username, email, password, fullName } = req.body;

  const taken = await emailOrUsernameTaken(email, username);
  if (taken) {
    return res.status(409).json({
      message: "That username or email is already registered.",
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await createUser({
    username,
    email,
    passwordHash,
    fullName,
    role: "student",
  });

  const token = generateToken(user);

  res.status(201).json({
    message: "Account created",
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