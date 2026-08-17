import bcrypt from "bcryptjs";

import {
  createUser,
  emailOrUsernameTaken,
  listStudents,
  setActive,
  deleteStudent as deleteStudentFromDB,
  formatUser,
} from "../models/user.model.js";

export async function getStudents(req, res) {
  const students = await listStudents({ limit: 200 });

  res.json({
    students: students.map(formatUser),
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