const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { validateLogin } = require('../validators/authValidators');
const { getXpProgress } = require('../utils/levelSystem');

// Turns a full DB user row into the shape we're happy to send to
// the browser - notably WITHOUT password_hash - and adds the
// derived level/progress info the dashboard needs.
function toSafeUser(user) {
  const progress = getXpProgress(user.xp);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    avatarUrl: user.avatar_url,
    xp: user.xp,
    level: progress.level,
    xpIntoLevel: progress.xpIntoLevel,
    xpForNextLevel: progress.xpForNextLevel,
    xpPercent: progress.percent,
    rating: user.rating,
    streak: user.streak,
    isActive: user.is_active,
    createdAt: user.created_at,
  };
}

// POST /api/auth/login
async function login(req, res) {
  const { errors, value } = validateLogin(req.body);
  if (errors.length) {
    return res.status(400).json({ error: errors[0], errors });
  }

  const user = await userModel.findByEmailOrUsername(value.identifier);

  // Deliberately vague message: we never reveal whether it was the
  // email/username or the password that was wrong. That prevents an
  // attacker from using the login form to discover which usernames
  // exist in the class.
  const invalidMessage = 'Invalid email/username or password.';

  if (!user) {
    return res.status(401).json({ error: invalidMessage });
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'This account has been disabled. Contact your admin.' });
  }

  const passwordMatches = await bcrypt.compare(value.password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ error: invalidMessage });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return res.json({ token, user: toSafeUser(user) });
}

// GET /api/auth/me  (requires requireAuth to have run first)
async function me(req, res) {
  const user = await userModel.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  // findById already excludes password_hash, but it also doesn't
  // have is_active typed the same way toSafeUser expects - reuse
  // the same shaping logic for consistency.
  const progress = getXpProgress(user.xp);
  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    avatarUrl: user.avatar_url,
    xp: user.xp,
    level: progress.level,
    xpIntoLevel: progress.xpIntoLevel,
    xpForNextLevel: progress.xpForNextLevel,
    xpPercent: progress.percent,
    rating: user.rating,
    streak: user.streak,
    isActive: user.is_active,
    createdAt: user.created_at,
  });
}

// POST /api/auth/logout
// JWTs are stateless - the server doesn't "store" sessions, so there
// is nothing to delete server-side. This endpoint exists so the
// frontend has one clear place to call; it just confirms and the
// frontend deletes its locally stored token.
async function logout(req, res) {
  return res.json({ message: 'Logged out.' });
}

module.exports = { login, me, logout, toSafeUser };
