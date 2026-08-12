const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const { validateCreateStudent } = require('../validators/authValidators');
const { getXpProgress } = require('../utils/levelSystem');

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
    xpPercent: progress.percent,
    rating: user.rating,
    streak: user.streak,
    isActive: user.is_active,
    createdAt: user.created_at,
  };
}

// GET /api/users  (admin only) - list all students for the admin panel
async function listStudents(req, res) {
  const students = await userModel.listStudents({ limit: 200 });
  return res.json({ students: students.map(toSafeUser) });
}

// POST /api/users  (admin only) - create a student account.
// This is the ONLY way a student account gets created; there is no
// public /register endpoint, matching "no open public registration"
// from the brief.
async function createStudent(req, res) {
  const { errors, value } = validateCreateStudent(req.body);
  if (errors.length) {
    return res.status(400).json({ error: errors[0], errors });
  }

  const taken = await userModel.emailOrUsernameTaken(value.email, value.username);
  if (taken) {
    return res.status(409).json({ error: 'That email or username is already registered.' });
  }

  // 10 salt rounds is a solid, widely-used default: strong enough to
  // resist brute-forcing, cheap enough not to slow down login.
  const passwordHash = await bcrypt.hash(value.password, 10);

  const user = await userModel.createUser({
    name: value.name,
    email: value.email,
    username: value.username,
    passwordHash,
    role: 'student',
  });

  return res.status(201).json({ user: toSafeUser(user) });
}

// PUT /api/users/:id/status  (admin only) - enable/disable a student
async function setStudentStatus(req, res) {
  const id = Number(req.params.id);
  const { isActive } = req.body;

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'isActive must be true or false.' });
  }

  const user = await userModel.setActive(id, isActive);
  if (!user) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  return res.json({ user: toSafeUser(user) });
}

module.exports = { listStudents, createStudent, setStudentStatus };
