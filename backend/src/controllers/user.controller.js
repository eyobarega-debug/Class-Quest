import bcrypt from "bcryptjs";
import crypto from "node:crypto";

import {
  createUser,
  emailOrUsernameTaken,
  listStudents,
  setActive,
  deleteStudent as deleteStudentFromDB,
  formatUser,
  getLeaderboard,
  findUserById,
  setPasswordHash,
} from "../models/user.model.js";

export async function getStudents(req, res) {
  const students = await listStudents({ limit: 200 });

  res.json({
    students: students.map(formatUser),
  });
}

export async function getLeaderboardHandler(req, res) {
  const rows = await getLeaderboard(50);

  res.json({
    leaderboard: rows.map((u, i) => ({
      rank: i + 1,
      id: u.id,
      username: u.username,
      name: u.full_name,
      avatarUrl: u.avatar_url,
      xp: u.xp || 0,
      rating: u.rating,
      streak: u.streak,
      solved: Number(u.solved_count) || 0,
    })),
  });
}

export async function createStudent(req, res) {
  const { username, email, password, fullName } = req.body;

  const taken = await emailOrUsernameTaken(email, username);

  if (taken) {
    return res.status(409).json({
      message: "That email or username is already registered.",
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

  res.status(201).json({
    user: formatUser(user),
  });
}

// ============================================================
// ADMIN: RESET A STUDENT'S PASSWORD
// If no newPassword is given in the body, a random temporary
// password is generated and returned once in the response so the
// admin can hand it to the student. It is never logged or stored
// anywhere in plaintext.
// ============================================================
export async function resetStudentPassword(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: "Invalid student id" });
  }

  const target = await findUserById(id);

  if (!target) {
    return res.status(404).json({ message: "Student not found" });
  }

  // Safety: this endpoint is only for resetting STUDENT accounts.
  // Prevents it being used (accidentally or otherwise) to overwrite
  // another admin's password.
  if (target.role !== "student") {
    return res.status(403).json({
      message: "This action can only reset passwords for student accounts.",
    });
  }

  let { newPassword } = req.body || {};
  let generated = false;

  if (!newPassword) {
    // 8-character random temporary password, e.g. "aZ3kQ9mP"
    newPassword = crypto.randomBytes(8).toString("base64url").slice(0, 8);
    generated = true;
  } else if (typeof newPassword !== "string" || newPassword.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters.",
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const updated = await setPasswordHash(id, passwordHash);

  res.json({
    message: "Password reset successfully.",
    user: formatUser(updated),
    // Only present when auto-generated — this is the ONE time it's
    // ever visible in plaintext, so show it to the admin right away.
    temporaryPassword: generated ? newPassword : undefined,
  });
}

export async function updateStudentStatus(req, res) {
  const id = Number(req.params.id);
  const { isActive } = req.body;

  if (!Number.isInteger(id)) {
    return res.status(400).json({
      message: "Invalid user id.",
    });
  }

  if (typeof isActive !== "boolean") {
    return res.status(400).json({
      message: "isActive must be true or false.",
    });
  }

  const user = await setActive(id, isActive);

  if (!user) {
    return res.status(404).json({
      message: "Student not found.",
    });
  }

  res.json({
    user: formatUser(user),
  });
}

// DELETE STUDENT
export async function deleteStudent(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({
      message: "Invalid user id.",
    });
  }

  const student = await deleteStudentFromDB(id);

  if (!student) {
    return res.status(404).json({
      message: "Student not found.",
    });
  }

  res.json({
    message: "Student deleted successfully.",
    user: formatUser(student),
  });
}