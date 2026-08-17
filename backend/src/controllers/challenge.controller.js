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
        timeout: timeoutMs,
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
    const { language, sourceCode } = req.body;

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

    let user = await findUserById(
      req.user.id
    );


    if (status === "accepted") {
      const alreadySolved =
        await hasAcceptedSubmission(
          req.user.id,
          challenge.id
        );

      if (!alreadySolved) {
        xpEarned = challenge.xp_reward;

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
    });


    res.json({
      status,
      passedCount,
      totalCount,
      xpEarned,

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