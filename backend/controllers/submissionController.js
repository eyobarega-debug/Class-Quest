const challengeModel = require('../models/challengeModel');
const submissionModel = require('../models/submissionModel');
const examModel = require('../models/examModel');
const { gradeSubmission } = require('../services/codeExecutor');

/**
 * Backend Source of Truth for Exam Timer Validation
 * Verifies whether an exam attempt has exceeded its allowed duration.
 */
async function isAttemptExpired(attemptId) {
  if (!attemptId) return false; // Allows non-exam practice submissions to bypass timer checks

  const attempt = await examModel.getAttemptWithExamDetails(attemptId);
  if (!attempt) return { error: 'Exam attempt not found.' };

  const startedAt = new Date(attempt.startedAt || attempt.started_at).getTime();
  const durationMs = attempt.duration * 60 * 1000; // Duration configured in minutes
  const now = Date.now();

  if (now - startedAt > durationMs || attempt.status === 'expired') {
    if (attempt.status !== 'expired') {
      await examModel.updateAttemptStatus(attemptId, 'expired');
    }
    return true;
  }
  return false;
}

/**
 * Normalizes and compares short answer submissions:
 * 1. Trims leading and trailing whitespace
 * 2. Compares case-insensitively
 */
function evaluateShortAnswer(userAnswer, expectedAnswer) {
  if (userAnswer === null || userAnswer === undefined || expectedAnswer === null || expectedAnswer === undefined) {
    return false;
  }
  return String(userAnswer).trim().toLowerCase() === String(expectedAnswer).trim().toLowerCase();
}

async function validateRequest(req) {
  const { challengeId, language, code } = req.body;

  if (!challengeId || !language || typeof code !== 'string') {
    return { error: 'challengeId, language, and code are required.' };
  }
  if (!code.trim()) {
    return { error: 'Please write some code before running.' };
  }

  const challenge = await challengeModel.getChallengeForStudent(challengeId);
  if (!challenge) {
    return { error: 'Challenge not found.' };
  }

  const supportsLanguage = challenge.languages.some((l) => l.language === language);
  if (!supportsLanguage) {
    return { error: `This challenge does not support ${language}.` };
  }

  return { challenge };
}

// POST /api/submissions/run
// Grades against PUBLIC test cases only. Preserves original execution flow.
async function run(req, res) {
  const { attemptId } = req.body;
  if (attemptId && (await isAttemptExpired(attemptId))) {
    return res.status(403).json({ error: 'Exam time has expired. Submissions are disabled.' });
  }

  const { error, challenge } = await validateRequest(req);
  if (error) return res.status(400).json({ error });

  const { language, code } = req.body;
  const publicTestCases = challenge.sampleTestCases.map((tc) => ({
    input: tc.input,
    expectedOutput: tc.expectedOutput,
    isHidden: false,
  }));

  if (publicTestCases.length === 0) {
    return res.status(400).json({ error: 'This challenge has no public test cases to run against.' });
  }

  const graded = await gradeSubmission({
    language,
    code,
    testCases: publicTestCases,
    timeLimitMs: challenge.timeLimitMs,
    memoryLimitKb: challenge.memoryLimitKb,
  });

  await submissionModel.recordSubmission({
    userId: req.user.id,
    challengeId: challenge.id,
    language,
    mode: 'run',
    code,
    status: graded.status,
    passedCount: graded.passedCount,
    totalCount: graded.totalCount,
    executionTimeMs: graded.results[0]?.executionTimeMs ?? null,
  });

  return res.json({
    status: graded.status,
    passedCount: graded.passedCount,
    totalCount: graded.totalCount,
    compileError: graded.compileError,
    // Safe to show full detail - every test case here is public by construction.
    results: graded.results,
  });
}

// POST /api/submissions/submit
// Grades against ALL test cases (public + hidden). Preserves original execution & security rule.
async function submit(req, res) {
  const { attemptId } = req.body;
  if (attemptId && (await isAttemptExpired(attemptId))) {
    return res.status(403).json({ error: 'Exam time has expired. Submissions are disabled.' });
  }

  const { error, challenge } = await validateRequest(req);
  if (error) return res.status(400).json({ error });

  const { language, code } = req.body;
  const allTestCases = await challengeModel.getTestCasesForGrading(challenge.id);

  const graded = await gradeSubmission({
    language,
    code,
    testCases: allTestCases,
    timeLimitMs: challenge.timeLimitMs,
    memoryLimitKb: challenge.memoryLimitKb,
  });

  await submissionModel.recordSubmission({
    userId: req.user.id,
    challengeId: challenge.id,
    language,
    mode: 'submit',
    code,
    status: graded.status,
    passedCount: graded.passedCount,
    totalCount: graded.totalCount,
    executionTimeMs: graded.results[0]?.executionTimeMs ?? null,
  });

  // Strip hidden-test detail before it ever reaches res.json().
  const safeResults = graded.results.map((r) => (
    r.isHidden
      ? { passed: r.passed, status: r.status } // no input/expected/actual
      : r
  ));
  return res.json({
    status: graded.status,
    passedCount: graded.passedCount,
    totalCount: graded.totalCount,
    compileError: graded.compileError,
    results: safeResults,
    xpNote: 'XP awarding arrives in Phase 4.',
  });
}

// POST /api/submissions/submit-answer
// Handles non-coding question types (MCQ, True/False, Short Answer)
async function submitAnswer(req, res) {
  const { questionId, answer, attemptId } = req.body;

  if (!questionId || answer === undefined || answer === null) {
    return res.status(400).json({ error: 'questionId and answer are required.' });
  }

  // 1. Timer Validation (Backend Source of Truth)
  if (attemptId && (await isAttemptExpired(attemptId))) {
    return res.status(403).json({ error: 'Exam time has expired. Submissions are disabled.' });
  }

  // 2. Fetch Non-Coding Question
  const question = await challengeModel.getQuestionById(questionId);
  if (!question) {
    return res.status(404).json({ error: 'Question not found.' });
  }

  let isCorrect = false;

  // 3. Evaluation based on Question Type
  switch (question.type) {
    case 'mcq':
    case 'true_false':
      isCorrect = String(answer).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
      break;

    case 'short_answer':
      isCorrect = evaluateShortAnswer(answer, question.correctAnswer);
      break;

    default:
      return res.status(400).json({ error: `Invalid question type: ${question.type}` });
  }

  const earnedPoints = isCorrect ? (question.points || 0) : 0;

  // 4. Record Non-Coding Submission
  await submissionModel.recordNonCodingSubmission({
    userId: req.user.id,
    questionId: question.id,
    attemptId: attemptId || null,
    answer,
    isCorrect,
    earnedPoints,
    status: isCorrect ? 'PASSED' : 'FAILED',
  });

  return res.json({
    isCorrect,
    earnedPoints,
    totalPoints: question.points || 0,
    status: isCorrect ? 'PASSED' : 'FAILED',
  });
}

module.exports = { run, submit, submitAnswer };