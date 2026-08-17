// ------------------------------------------------------------------
// Phase 3: this replaces the Phase 2 stub with real grading, using
// codeExecutor.js. The validation logic (challenge exists, language
// supported, code non-empty) is unchanged from Phase 2 - only what
// happens after validation is new.
// ------------------------------------------------------------------
const challengeModel = require('../models/challengeModel');
const submissionModel = require('../models/submissionModel');
const { gradeSubmission } = require('../services/codeExecutor');

async function validateRequest(req) {
  const { challengeId, language, code } = req.body;

  if (!challengeId  !language  typeof code !== 'string') {
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
    return { error: This challenge does not support ${language}. };
  }

  return { challenge };
}

// POST /api/submissions/run
// Grades against PUBLIC test cases only, and shows the actual
// input/expected/actual output for each - this is meant to help the
// student debug, matching section 11's "Run" behavior.
async function run(req, res) {
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
// Grades against ALL test cases (public + hidden), but the response
// NEVER includes a hidden test case's input/expected/actual output -
// only whether it passed. This is the "hidden test cases must never
// be sent to the frontend" rule (brief section 25), applied even
// after code execution, not just before.
async function submit(req, res) {
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
    // XP awarding arrives in Phase 4. Being explicit about that here
    // (rather than silently returning xpEarned: 0) avoids the frontend
    // ever having to guess whether 0 means "no XP" or "not implemented".
    xpNote: 'XP awarding arrives in Phase 4.',
  });
}

module.exports = { run, submit };