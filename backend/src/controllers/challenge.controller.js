import vm from "node:vm";
import {
  listChallenges,
  getChallengeBySlug,
  getAllTestCases,
  updateChallenge,
  deleteChallenge,
  createChallenge,
  createSubmission,
  hasAcceptedSubmission,
} from "../models/challenge.model.js";
import { addXp, findUserById, formatUser } from "../models/user.model.js";

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function getChallenges(req, res) {
  const { difficulty, category, language, search } = req.query;
  const challenges = await listChallenges({ difficulty, category, language, search });
  res.json({ challenges });
}

export async function getChallengeDetail(req, res) {
  const { slug } = req.params;
  const challenge = await getChallengeBySlug(slug);

  if (!challenge) {
    return res.status(404).json({ message: "Challenge not found" });
  }

  res.json({ challenge });
}

export async function postChallenge(req, res) {
  const {
    title, description, difficulty, category, tags,
    xpReward, timeLimitMs, memoryLimitMb, constraints,
    languages, testCases,
  } = req.body;

  const challenge = await createChallenge({
    title,
    slug: slugify(title),
    description,
    difficulty,
    category,
    tags: tags || [],
    xpReward: xpReward || 100,
    timeLimitMs: timeLimitMs || 2000,
    memoryLimitMb: memoryLimitMb || 128,
    constraints,
    languages,
    testCases: testCases || [],
    createdBy: req.user.id,
  });

  res.status(201).json({ challenge });
}

export async function patchChallenge(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: "Invalid challenge id" });
  }

  const challenge = await updateChallenge(id, req.body);
  if (!challenge) {
    return res.status(404).json({ message: "Challenge not found" });
  }

  res.json({ challenge });
}

export async function removeChallenge(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: "Invalid challenge id" });
  }

  const deleted = await deleteChallenge(id);
  if (!deleted) {
    return res.status(404).json({ message: "Challenge not found" });
  }

  res.status(204).send();
}

// --- Code execution --------------------------------------------------
//
// Phase 1: JavaScript only, run inside Node's built-in `vm` module with
// a strict timeout and no require/filesystem/network access. This is
// NOT full isolation (shares the host process/memory) — fine for a
// trusted classroom, but must be replaced with a properly sandboxed
// runner (Docker / isolated-vm / separate execution service) before
// this is ever exposed outside a trusted class.
function runJavaScript(sourceCode, input, timeoutMs) {
  const sandbox = { input };
  const context = vm.createContext(sandbox);

  const wrapped = `
    (function () {
      ${sourceCode}
      if (typeof solve === "function") {
        return solve(input);
      }
      return undefined;
    })()
  `;

  const output = vm.runInContext(wrapped, context, { timeout: timeoutMs });
  return output;
}

function executeAgainstTests(language, sourceCode, testCases, timeLimitMs) {
  const results = [];

  for (const test of testCases) {
    const start = Date.now();

    if (language !== "javascript") {
      results.push({ passed: false, status: "unsupported_language" });
      continue;
    }

    try {
      const output = runJavaScript(sourceCode, test.input, timeLimitMs);
      const actual = typeof output === "string" ? output.trim() : JSON.stringify(output);
      const expected = test.expected_output.trim();

      results.push({
        passed: actual === expected,
        status: "ran",
        expected: test.is_hidden ? undefined : expected,
        actual: test.is_hidden ? undefined : actual,
        executionTimeMs: Date.now() - start,
      });
    } catch (error) {
      const isTimeout = /Script execution timed out/i.test(error.message);
      results.push({
        passed: false,
        status: isTimeout ? "time_limit_exceeded" : "runtime_error",
        message: error.message,
        executionTimeMs: Date.now() - start,
      });
    }
  }

  return results;
}

export async function runCode(req, res) {
  const { slug } = req.params;
  const { language, sourceCode } = req.body;

  const challenge = await getChallengeBySlug(slug);
  if (!challenge) {
    return res.status(404).json({ message: "Challenge not found" });
  }

  const results = executeAgainstTests(language, sourceCode, challenge.publicTests, challenge.time_limit_ms);

  res.json({
    passedCount: results.filter((r) => r.passed).length,
    totalCount: results.length,
    results,
  });
}

export async function submitCode(req, res) {
  const { slug } = req.params;
  const { language, sourceCode } = req.body;

  const challenge = await getChallengeBySlug(slug);
  if (!challenge) {
    return res.status(404).json({ message: "Challenge not found" });
  }

  const allTests = await getAllTestCases(challenge.id);
  const results = executeAgainstTests(language, sourceCode, allTests, challenge.time_limit_ms);

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const allPassed = totalCount > 0 && passedCount === totalCount;

  let status = "wrong_answer";
  if (results.some((r) => r.status === "time_limit_exceeded")) status = "time_limit_exceeded";
  else if (results.some((r) => r.status === "runtime_error")) status = "runtime_error";
  else if (results.some((r) => r.status === "unsupported_language")) status = "unsupported_language";
  else if (allPassed) status = "accepted";

  let xpEarned = 0;
  let user = await findUserById(req.user.id);

  if (status === "accepted") {
    const alreadySolved = await hasAcceptedSubmission(req.user.id, challenge.id);
    if (!alreadySolved) {
      xpEarned = challenge.xp_reward;
      user = await addXp(req.user.id, xpEarned);
    }
  }

  await createSubmission({
    userId: req.user.id,
    challengeId: challenge.id,
    language,
    sourceCode,
    status,
    passedTests: passedCount,
    totalTests: totalCount,
    executionTimeMs: results.reduce((sum, r) => sum + (r.executionTimeMs || 0), 0),
    xpEarned,
  });

  res.json({
    status,
    passedCount,
    totalCount,
    xpEarned,
    results: results.map((r) => ({
      passed: r.passed,
      status: r.status,
      executionTimeMs: r.executionTimeMs,
    })),
    user: formatUser(user),
  });
}