// Small hand-written validators. A library like express-validator or
// zod is fine to add later, but for two simple forms (login + create
// student) plain functions are easier to read and are one less
// dependency to learn.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

function validateLogin(body) {
  const errors = [];
  const identifier = (body.identifier || body.email || body.username || '').trim();
  const password = body.password || '';

  if (!identifier) errors.push('Email or username is required.');
  if (!password) errors.push('Password is required.');

  return { errors, value: { identifier, password } };
}

function validateCreateStudent(body) {
  const errors = [];
  const name = (body.name || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const username = (body.username || '').trim();
  const password = body.password || '';

  if (name.length < 2) errors.push('Name must be at least 2 characters.');
  if (!EMAIL_RE.test(email)) errors.push('A valid email is required.');
  if (!USERNAME_RE.test(username)) {
    errors.push('Username must be 3-30 characters and contain only letters, numbers, or underscores.');
  }
  if (password.length < 8) errors.push('Password must be at least 8 characters.');

  return { errors, value: { name, email, username, password } };
}

module.exports = { validateLogin, validateCreateStudent };
