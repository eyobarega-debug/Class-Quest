const challengeModel = require('../models/challengeModel');
const { validateChallenge } = require('../validators/challengeValidators');

// GET /api/challenges?language=&difficulty=&category=&search=
async function listChallenges(req, res) {
  const { language, difficulty, category, search } = req.query;
  const challenges = await challengeModel.listChallenges({ language, difficulty, category, search });
  return res.json({ challenges });
}

// GET /api/challenges/:idOrSlug
// Every logged-in student can view a challenge, but NEVER its
// hidden test cases - challengeModel.getChallengeForStudent()
// filters those out before this function even sees the data.
async function getChallenge(req, res) {
  const challenge = await challengeModel.getChallengeForStudent(req.params.idOrSlug);
  if (!challenge) {
    return res.status(404).json({ error: 'Challenge not found.' });
  }
  return res.json({ challenge });
}

// GET /api/challenges/:idOrSlug/admin  (admin only - includes hidden test cases, for editing)
async function getChallengeForAdmin(req, res) {
  const challenge = await challengeModel.getChallengeForAdmin(req.params.idOrSlug);
  if (!challenge) {
    return res.status(404).json({ error: 'Challenge not found.' });
  }
  return res.json({ challenge });
}

// POST /api/challenges  (admin only)
async function createChallenge(req, res) {
  const { errors, value } = validateChallenge(req.body);
  if (errors.length) {
    return res.status(400).json({ error: errors[0], errors });
  }

  if (await challengeModel.slugExists(value.slug)) {
    return res.status(409).json({ error: 'A challenge with a very similar title already exists.' });
  }

  const id = await challengeModel.createChallenge(value, req.user.id);
  const challenge = await challengeModel.getChallengeForAdmin(id);
  return res.status(201).json({ challenge });
}

// PUT /api/challenges/:id  (admin only)
async function updateChallenge(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid challenge id.' });
  }

  const existing = await challengeModel.getChallengeForAdmin(id);
  if (!existing) {
    return res.status(404).json({ error: 'Challenge not found.' });
  }

  const { errors, value } = validateChallenge(req.body);
  if (errors.length) {
    return res.status(400).json({ error: errors[0], errors });
  }

  if (await challengeModel.slugExists(value.slug, id)) {
    return res.status(409).json({ error: 'A challenge with a very similar title already exists.' });
  }

  await challengeModel.updateChallenge(id, value);
  const challenge = await challengeModel.getChallengeForAdmin(id);
  return res.json({ challenge });
}

// DELETE /api/challenges/:id  (admin only)
async function deleteChallenge(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid challenge id.' });
  }

  const existing = await challengeModel.getChallengeForAdmin(id);
  if (!existing) {
    return res.status(404).json({ error: 'Challenge not found.' });
  }

  await challengeModel.deleteChallenge(id);
  return res.status(204).send();
}

module.exports = {
  listChallenges,
  getChallenge,
  getChallengeForAdmin,
  createChallenge,
  updateChallenge,
  deleteChallenge,
};