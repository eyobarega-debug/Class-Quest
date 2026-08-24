import vm from "node:vm";
import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const execFileAsync = promisify(execFile);
import {
  listChallenges,
  getChallengeBySlug,
  getAllTestCases,
  updateChallenge,
  deleteChallenge,
  createChallenge,
  createSubmission,
  hasAcceptedSubmission,
  countSubmissionsForUserChallenge,
  listSubmissionsForAdmin,
  getSubmissionByIdForAdmin,
} from "../models/challenge.model.js";
import { addXp, findUserById, formatUser } from "../models/user.model.js";

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Submission attempt limiting: each WRONG attempt reduces the XP a
// student can still earn by 20% of the challenge's full reward.
// After MAX_SUBMIT_ATTEMPTS total attempts (right or wrong) on a
// challenge they haven't already solved, no more submissions are
// accepted. "Run" is unaffected — this only gates "Submit".
const MAX_SUBMIT_ATTEMPTS = 4;
const XP_PENALTY_PER_ATTEMPT = 0.2;

export async function getChallenges(req, res) {
  const { difficulty, category, language, search } = req.query;
  const challenges = await listChallenges({ difficulty, category, language, search });
  res.json({ challenges });
}

// ADMIN: list every student's coding submissions, with the exact
// score "out of" the challenge's total test cases (not XP), plus
// their source code so the admin can see what the student actually
// submitted. Optional ?studentId= / ?challengeId= filters.
export async function getAllSubmissions(req, res) {
  const { studentId, challengeId } = req.query;

  const submissions = await listSubmissionsForAdmin({
    userId: studentId ? Number(studentId) : undefined,
    challengeId: challengeId ? Number(challengeId) : undefined,
  });

  res.json({
    submissions: submissions.map((s) => ({
      id: s.id,
      student: { id: s.user_id, name: s.full_name, username: s.username },
      challenge: { id: s.challenge_id, title: s.challenge_title, slug: s.challenge_slug },
      language: s.language,
      sourceCode: s.source_code,
      status: s.status,
      score: `${s.passed_tests}/${s.total_tests}`, // out of the question, not XP
      passedTests: s.passed_tests,
      totalTests: s.total_tests,
      executionTimeMs: s.execution_time_ms,
      xpEarned: s.xp_earned,
      examAttemptId: s.exam_attempt_id,
      submittedAt: s.created_at,
    })),
  });
}

// ADMIN: full detail (source code included) for a single submission.
export async function getSubmissionDetail(req, res) {
  const id = Number(req.params.id);
  const submission = await getSubmissionByIdForAdmin(id);

  if (!submission) {
    return res.status(404).json({ message: "Submission not found" });
  }

  res.json({
    submission: {
      id: submission.id,
      student: { id: submission.user_id, name: submission.full_name, username: submission.username },
      challenge: { id: submission.challenge_id, title: submission.challenge_title, slug: submission.challenge_slug },
      language: submission.language,
      sourceCode: submission.source_code,
      status: submission.status,
      score: `${submission.passed_tests}/${submission.total_tests}`,
      passedTests: submission.passed_tests,
      totalTests: submission.total_tests,
      executionTimeMs: submission.execution_time_ms,
      xpEarned: submission.xp_earned,
      submittedAt: submission.created_at,
    },
  });
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
    languages, testCases, isPublished,
  } = req.body;

  const basePayload = {
    title,
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
    isPublished: isPublished === undefined ? true : Boolean(isPublished),
  };

  // Slugs must be unique. Exam-only questions are likely to reuse
  // generic titles across different exams ("Loops", "Arrays"), so
  // retry with a short random suffix on collision instead of erroring.
  let challenge;
  let attempt = 0;

  while (!challenge) {
    attempt += 1;
    const slug = attempt === 1 ? slugify(title) : `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;

    try {
      challenge = await createChallenge({ ...basePayload, slug });
    } catch (error) {
      if (error.code === "23505" && attempt < 5) continue; // unique_violation, retry
      throw error;
    }
  }

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

function runJavaScript(sourceCode, input, timeoutMs) {
  let output = "";

  const sandbox = {
    input,
    console: {
      log: (...args) => {
        output +=
          args
            .map((arg) =>
              typeof arg === "string" ? arg : JSON.stringify(arg)
            )
            .join(" ") + "\n";
      },
    },
  };

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

  const result = vm.runInContext(wrapped, context, {
    timeout: timeoutMs,
  });

  if (result !== undefined) {
    return typeof result === "string"
      ? result
      : JSON.stringify(result);
  }

  return output.trim();
}

// Python execution (mirrors runCpp: write to a temp file, run it,
// capture stdout). Requires a real Python install on the server's
// PATH. Windows ships a "python"/"python3" shim that isn't a real
// interpreter unless Python is actually installed — it just prints
// an "install from the Microsoft Store" message and exits non-zero,
// which looks like a normal failed run rather than "command missing"
// (no ENOENT), so that specific message is detected explicitly below.
let resolvedPythonCommand = null;

function isPythonUnavailableError(err) {
  const text = `${err.stderr || ""} ${err.message || ""}`;
  return err.code === "ENOENT" || /was not found/i.test(text) || /Microsoft Store/i.test(text);
}

async function runPython(sourceCode, input, timeoutMs) {
  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "classquest-")
  );

  const sourcePath = path.join(tempDir, "main.py");

  try {
    await writeFile(sourcePath, sourceCode, "utf8");

    const candidates = resolvedPythonCommand
      ? [resolvedPythonCommand]
      : process.platform === "win32"
        ? ["python", "py", "python3"]
        : ["python3", "python"];

    let lastError;

    for (const cmd of candidates) {
      try {
        const { stdout } = await execFileAsync(
          cmd,
          [sourcePath],
          { input, timeout: timeoutMs }
        );

        resolvedPythonCommand = cmd; // remember what worked, skip probing next time
        return stdout.trim();
      } catch (err) {
        lastError = err;
        if (!isPythonUnavailableError(err)) {
          throw err; // a real error in the student's code — propagate immediately
        }
        // otherwise this command isn't a real Python install; try the next one
      }
    }

    throw new Error(
      "Python is not installed on this server (or not on PATH). Install Python from python.org, ensure 'Add python.exe to PATH' is checked during setup, then restart the backend."
    );
  } finally {
    await unlink(sourcePath).catch(() => {});
    await fs.rm(tempDir, {
      recursive: true,
      force: true,
    }).catch(() => {});
  }
}

// C++ execution
async function runCpp(sourceCode, input, timeoutMs) {
  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "classquest-")
  );

  const sourcePath = path.join(tempDir, "main.cpp");
  const exePath = path.join(tempDir, "main.exe");

  try {
    await writeFile(sourcePath, sourceCode, "utf8");

    await execFileAsync(
      "g++",
      [
        sourcePath,
        "-std=c++17",
        "-O2",
        "-o",
        exePath,
      ],
      {
        timeout:  15000,
      }
    );

    const { stdout } = await execFileAsync(
      exePath,
      [],
      {
        input,
        timeout: timeoutMs,
      }
    );

    return stdout.trim();
  } finally {
    await unlink(sourcePath).catch(() => {});
    await unlink(exePath).catch(() => {});
    await fs.rm(tempDir, {
      recursive: true,
      force: true,
    }).catch(() => {});
  }
}

// Run code against test cases
async function executeAgainstTests(
  language,
  sourceCode,
  testCases,
  timeLimitMs
) {
  const results = [];

  for (const test of testCases) {
    const start = Date.now();

    try {
      let actual;

      // JavaScript
      if (language === "javascript") {
        const output = runJavaScript(
          sourceCode,
          test.input,
          timeLimitMs
        );

        actual =
          typeof output === "string"
            ? output.trim()
            : JSON.stringify(output);
      }

      // C++
      else if (language === "cpp" || language === "c++") {
        actual = await runCpp(
          sourceCode,
          test.input,
          timeLimitMs
        );
      }

      // Python
      else if (language === "python" || language === "python3") {
        actual = await runPython(
          sourceCode,
          test.input,
          timeLimitMs
        );
      }

      // Unsupported language
      else {
        results.push({
          passed: false,
          status: "unsupported_language",
          executionTimeMs: Date.now() - start,
        });

        continue;
      }

      const expected = test.expected_output.trim();

      results.push({
        passed: actual === expected,
        status: "ran",

        // Don't reveal hidden test details
        expected: test.is_hidden
          ? undefined
          : expected,

        actual: test.is_hidden
          ? undefined
          : actual,

        executionTimeMs: Date.now() - start,
      });

    } catch (error) {
      const isTimeout =
        error.killed ||
        error.code === "ETIMEDOUT" ||
        /timed out/i.test(error.message) ||
        /Script execution timed out/i.test(error.message);

      results.push({
        passed: false,

        status: isTimeout
          ? "time_limit_exceeded"
          : "runtime_error",

        message:
          error.stderr ||
          error.message,

        executionTimeMs: Date.now() - start,
      });
    }
  }

  return results;
}

// RUN CODE
export async function runCode(req, res) {
  try {
    const { slug } = req.params;
    const { language, sourceCode } = req.body;

    const challenge = await getChallengeBySlug(slug);

    if (!challenge) {
      return res.status(404).json({
        message: "Challenge not found",
      });
    }

    const results = await executeAgainstTests(
      language,
      sourceCode,
      challenge.publicTests || [],
      challenge.time_limit_ms || 2000
    );

    res.json({
      passedCount: results.filter(
        (r) => r.passed
      ).length,

      totalCount: results.length,

      results,
    });

  } catch (error) {
    console.error("RUN CODE ERROR:", error);

    res.status(500).json({
      type: "error",
      message: error.message,
    });
  }
}

// SUBMIT CODE
export async function submitCode(req, res) {
  try {
    const { slug } = req.params;
    const { language, sourceCode, examAttemptId } = req.body;

    console.log("SUBMIT REQUEST:", {
      slug,
      language,
      sourceCode,
    });

    const challenge = await getChallengeBySlug(slug);

    if (!challenge) {
      return res.status(404).json({
        message: "Challenge not found",
      });
    }

    // Optional: this submission is answering a coding question inside
    // a timed exam. Validated here (not trusted blindly) but does not
    // otherwise change the run/submit logic below in any way.
    let validatedExamAttemptId = null;
    if (examAttemptId) {
      const { getAttemptById: getExamAttemptById, getExamById: getExamByIdForAttempt } = await import("../models/exam.model.js");
      const attempt = await getExamAttemptById(Number(examAttemptId));

      if (!attempt || attempt.user_id !== req.user.id) {
        return res.status(404).json({ message: "Exam attempt not found" });
      }

      const exam = await getExamByIdForAttempt(attempt.exam_id);
      const elapsedMs = Date.now() - new Date(attempt.started_at).getTime();
      const expired = elapsedMs > exam.duration_minutes * 60 * 1000;

      if (attempt.status !== "in_progress" || expired) {
        return res.status(403).json({ message: "This exam attempt is no longer active. Time may have expired." });
      }

      validatedExamAttemptId = attempt.id;
    }

    const alreadySolved = await hasAcceptedSubmission(
      req.user.id,
      challenge.id
    );

    // Once solved, let the student keep practicing without hitting the
    // attempt cap — there's no more XP to gain, so nothing to protect.
    let attemptsUsedBefore = 0;

    if (!alreadySolved) {
      attemptsUsedBefore = await countSubmissionsForUserChallenge(
        req.user.id,
        challenge.id
      );

      if (attemptsUsedBefore >= MAX_SUBMIT_ATTEMPTS) {
        return res.status(403).json({
          message: `You've used all ${MAX_SUBMIT_ATTEMPTS} attempts for this challenge.`,
          attemptsUsed: attemptsUsedBefore,
          attemptsRemaining: 0,
        });
      }
    }

    const allTests = await getAllTestCases(
      challenge.id
    );

    const results = await executeAgainstTests(
      language,
      sourceCode,
      allTests,
      challenge.time_limit_ms || 2000
    );

    const passedCount = results.filter(
      (r) => r.passed
    ).length;

    const totalCount = results.length;

    const allPassed =
      totalCount > 0 &&
      passedCount === totalCount;

    let status = "wrong_answer";

    if (
      results.some(
        (r) =>
          r.status === "time_limit_exceeded"
      )
    ) {
      status = "time_limit_exceeded";
    }

    else if (
      results.some(
        (r) => r.status === "runtime_error"
      )
    ) {
      status = "runtime_error";
    }

    else if (
      results.some(
        (r) =>
          r.status === "unsupported_language"
      )
    ) {
      status = "unsupported_language";
    }

    else if (allPassed) {
      status = "accepted";
    }


    let xpEarned = 0;
    let xpScalePercent = 100;

    let user = await findUserById(
      req.user.id
    );

    const attemptNumber = attemptsUsedBefore + 1;
    const attemptsRemaining = Math.max(
      0,
      MAX_SUBMIT_ATTEMPTS - attemptNumber
    );

    if (status === "accepted") {
      if (!alreadySolved) {
        const scale = Math.max(
          0,
          1 - XP_PENALTY_PER_ATTEMPT * (attemptNumber - 1)
        );

        xpScalePercent = Math.round(scale * 100);
        xpEarned = Math.floor(challenge.xp_reward * scale);

        user = await addXp(
          req.user.id,
          xpEarned
        );
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

      executionTimeMs: results.reduce(
        (sum, r) =>
          sum + (r.executionTimeMs || 0),
        0
      ),

      xpEarned,
      examAttemptId: validatedExamAttemptId,
    });


    res.json({
      status,
      passedCount,
      totalCount,
      xpEarned,
      xpScalePercent,
      alreadySolved,
      attemptNumber,
      attemptsRemaining,
      maxAttempts: MAX_SUBMIT_ATTEMPTS,

      results: results.map((r) => ({
        passed: r.passed,
        status: r.status,
        executionTimeMs:
          r.executionTimeMs,
      })),

      user: formatUser(user),
    });

  } catch (error) {
    console.error(
      "SUBMIT CODE ERROR:",
      error
    );

    res.status(500).json({
      type: "error",
      message: error.message,
    });
  }
}