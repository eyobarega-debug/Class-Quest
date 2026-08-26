import bcrypt from "bcryptjs";
import {
  listExams,
  getExamById,
  getExamWithPasswordHash,
  createExam,
  updateExam,
  approveExamResult,
  updateExamPassword,
  deleteExam,
  getExamQuestionsForAdmin,
  getExamQuestionsForStudent,
  getExamQuestionById,
  createExamQuestion,
  bulkCreateExamQuestions,
  updateExamQuestion,
  deleteExamQuestion,
  getActiveAttempt,
  getCompletedAttempt,
  getAttemptById,
  createAttempt,
  markAttemptStatus,
  upsertExamAnswer,
  getAttemptAnswers,
  getAttemptCodingScore,
  listAttemptsForExam,
  getAttemptDetailForAdmin,
  listExamAnswersForAdmin,
  getAttemptStatusesForUser,
  updateExamAnswerGrade,
  updateAttemptScore,
} from "../models/exam.model.js";
import { getChallengeById } from "../models/challenge.model.js";

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

// Remaining seconds for an in-progress attempt, computed purely from
// the backend clock + stored started_at. Never trust a client-sent
// "time remaining" value.
function remainingSeconds(attempt, durationMinutes) {
  const elapsedMs = Date.now() - new Date(attempt.started_at).getTime();
  const totalMs = durationMinutes * 60 * 1000;
  return Math.max(0, Math.round((totalMs - elapsedMs) / 1000));
}

function isExpired(attempt, durationMinutes) {
  return remainingSeconds(attempt, durationMinutes) <= 0;
}

// Auto-transition an in-progress attempt to "expired" if its time is
// up. Called at the top of every attempt-touching endpoint so that
// expiry is enforced no matter which route the student hits next.
async function enforceExpiry(attempt, exam) {
  if (attempt.status === "in_progress" && isExpired(attempt, exam.duration_minutes)) {
    return markAttemptStatus(attempt.id, "expired");
  }
  return attempt;
}

// -----------------------------------------------------------------------
// Admin: exam CRUD
// -----------------------------------------------------------------------

export async function getExams(req, res) {
  const publishedOnly = req.user.role !== "admin";

  const exams = await listExams({ publishedOnly });

  if (req.user.role === "admin") {
    return res.json({ exams });
  }

  // Attach this student's own attempt status to each exam
  const attemptRows = await getAttemptStatusesForUser(req.user.id);

  const attemptByExam = new Map(
    attemptRows.map((a) => [a.exam_id, a])
  );

   const examsWithStatus = exams.map((exam) => {
    const attempt = attemptByExam.get(exam.id);

    return {
      ...exam,
      studentAttempt: attempt
        ? {
            status: attempt.status,
            resultApproved: attempt.result_approved,
            totalScore: attempt.result_approved
              ? attempt.total_score
              : null,
            maxScore: attempt.result_approved
              ? attempt.max_score
              : null,
          }
        : null,
    };
  });

  res.json({ exams: examsWithStatus });
}

// -----------------------------------------------------------------------
// Admin: approve exam result
// -----------------------------------------------------------------------

export async function approveResult(req, res) {
  const attemptId = Number(req.params.attemptId);

  if (!Number.isInteger(attemptId)) {
    return res.status(400).json({
      message: "Invalid attempt ID",
    });
  }

  const attempt = await approveExamResult(attemptId);

  if (!attempt) {
    return res.status(404).json({
      message:
        "Exam attempt not found or result cannot be approved",
    });
  }

  return res.json({
    message: "Exam result approved successfully",
    attempt: {
      id: attempt.id,
      status: attempt.status,
      totalScore: attempt.total_score,
      maxScore: attempt.max_score,
      resultApproved: attempt.result_approved,
      submittedAt: attempt.submitted_at,
    },
  });
}

export async function getExamDetail(req, res) {
  const id = Number(req.params.id);
  const exam = await getExamById(id);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  if (req.user.role === "admin") {
    const questions = await getExamQuestionsForAdmin(id);
    return res.json({ exam, questions });
  }

  if (!exam.is_published) {
    return res.status(404).json({ message: "Exam not found" });
  }

  // Students get the exam metadata (never the password) but not the
  // question bodies until they've started an attempt.
  res.json({ exam });
}

export async function postExam(req, res) {
  const { title, description, durationMinutes, password } = req.body;

  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  const exam = await createExam({
    title,
    description,
    durationMinutes,
    passwordHash,
    createdBy: req.user.id,
  });

  res.status(201).json({ exam });
}

export async function patchExam(req, res) {
  const id = Number(req.params.id);
  const { title, description, durationMinutes, isPublished } = req.body;

  const exam = await updateExam(id, { title, description, durationMinutes, isPublished });
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  res.json({ exam });
}

// Dedicated endpoint for changing/removing the password so it can
// never be set accidentally through the generic patch above.
export async function changeExamPassword(req, res) {
  const id = Number(req.params.id);
  const { password } = req.body; // empty/omitted string removes the password

  const existing = await getExamById(id);
  if (!existing) return res.status(404).json({ message: "Exam not found" });

  const passwordHash = password ? await bcrypt.hash(password, 10) : null;
  const exam = await updateExamPassword(id, passwordHash);

  res.json({ exam });
}

export async function removeExam(req, res) {
  const id = Number(req.params.id);
  const deleted = await deleteExam(id);
  if (!deleted) return res.status(404).json({ message: "Exam not found" });
  res.status(204).send();
}

// -----------------------------------------------------------------------
// Admin: exam questions
// -----------------------------------------------------------------------

export async function postExamQuestion(req, res) {
  const examId = Number(req.params.id);
  const exam = await getExamById(examId);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  const { type, question, points, orderIndex, options, correctOption, correctAnswer, expectedAnswer, challengeId } = req.body;

  let data = null;
  let resolvedChallengeId = null;

  if (type === "mcq") {
    data = { options, correctOption };
  } else if (type === "true_false") {
    data = { correctAnswer: Boolean(correctAnswer) };
  } else if (type === "short_answer") {
    data = { expectedAnswer };
  } else if (type === "coding") {
    const challenge = await getChallengeById(Number(challengeId));
    if (!challenge) {
      return res.status(400).json({ message: "That coding challenge does not exist" });
    }
    resolvedChallengeId = challenge.id;
  } else {
    return res.status(400).json({ message: "Invalid question type" });
  }

  const created = await createExamQuestion({
    examId,
    type,
    question,
    points,
    orderIndex,
    data,
    challengeId: resolvedChallengeId,
  });

  res.status(201).json({ question: created });
}

// Add many questions to an exam in one request — "create it like an
// exam" bulk import. Body: { questions: [ {type, question, points,
// options, correctOption, correctAnswer, expectedAnswer, challengeId}, ... ] }
export async function postExamQuestionsBulk(req, res) {
  const examId = Number(req.params.id);
  const exam = await getExamById(examId);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  const { questions } = req.body;

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: "questions must be a non-empty array" });
  }

  const prepared = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const { type, question, points, orderIndex, options, correctOption, correctAnswer, expectedAnswer, challengeId } = q;

    if (!["mcq", "true_false", "short_answer", "coding"].includes(type)) {
      return res.status(400).json({ message: `Question ${i + 1}: type must be mcq, true_false, short_answer, or coding` });
    }

    if (type === "coding") {
      const challenge = await getChallengeById(Number(challengeId));
      if (!challenge) {
        return res.status(400).json({ message: `Question ${i + 1}: coding challenge not found` });
      }
      prepared.push({ type, points, orderIndex, challengeId: challenge.id });
      continue;
    }

    if (!question || !String(question).trim()) {
      return res.status(400).json({ message: `Question ${i + 1}: question text is required` });
    }

    let data;
    if (type === "mcq") {
      if (!Array.isArray(options) || options.length < 2 || !correctOption || !options.includes(correctOption)) {
        return res.status(400).json({ message: `Question ${i + 1}: mcq needs 2+ options and a matching correctOption` });
      }
      data = { options, correctOption };
    } else if (type === "true_false") {
      if (correctAnswer === undefined) {
        return res.status(400).json({ message: `Question ${i + 1}: correctAnswer is required` });
      }
      data = { correctAnswer: Boolean(correctAnswer) };
    } else if (type === "short_answer") {
      if (!expectedAnswer || !String(expectedAnswer).trim()) {
        return res.status(400).json({ message: `Question ${i + 1}: expectedAnswer is required` });
      }
      data = { expectedAnswer };
    }

    prepared.push({ type, question, points, orderIndex, data });
  }

  const created = await bulkCreateExamQuestions(examId, prepared);
  res.status(201).json({ questions: created });
}

export async function patchExamQuestion(req, res) {
  const id = Number(req.params.questionId);
  const existing = await getExamQuestionById(id);
  if (!existing) return res.status(404).json({ message: "Question not found" });

  const { question, points, orderIndex, options, correctOption, correctAnswer, expectedAnswer, challengeId } = req.body;

  const fields = { question, points, orderIndex };

  if (existing.type === "mcq" && (options !== undefined || correctOption !== undefined)) {
    fields.data = {
      options: options ?? existing.data?.options,
      correctOption: correctOption ?? existing.data?.correctOption,
    };
  } else if (existing.type === "true_false" && correctAnswer !== undefined) {
    fields.data = { correctAnswer: Boolean(correctAnswer) };
  } else if (existing.type === "short_answer" && expectedAnswer !== undefined) {
    fields.data = { expectedAnswer };
  } else if (existing.type === "coding" && challengeId !== undefined) {
    const challenge = await getChallengeById(Number(challengeId));
    if (!challenge) {
      return res.status(400).json({ message: "That coding challenge does not exist" });
    }
    fields.challengeId = challenge.id;
  }

  const updated = await updateExamQuestion(id, fields);
  res.json({ question: updated });
}

export async function removeExamQuestion(req, res) {
  const id = Number(req.params.questionId);
  const deleted = await deleteExamQuestion(id);
  if (!deleted) return res.status(404).json({ message: "Question not found" });
  res.status(204).send();
}

// -----------------------------------------------------------------------
// Student: password verification + starting/taking/finishing an exam
// -----------------------------------------------------------------------

// Verifies the exam password WITHOUT starting the attempt, so the
// frontend can show "correct, click Start" without also committing
// to starting the timer. Never returns the password or its hash.
export async function verifyExamPassword(req, res) {
  const id = Number(req.params.id);
  const { password } = req.body;

  const exam = await getExamWithPasswordHash(id);
  if (!exam || !exam.is_published) {
    return res.status(404).json({ message: "Exam not found" });
  }

  if (!exam.password_hash) {
    return res.json({ verified: true });
  }

  const matches = password ? await bcrypt.compare(password, exam.password_hash) : false;

  if (!matches) {
    return res.status(401).json({ message: "Incorrect exam password." });
  }

  res.json({ verified: true });
}

// Starts (or resumes) the student's attempt. Requires the password to
// be re-checked here too so starting an attempt can never be done by
// calling /start directly while skipping /verify-password.
export async function startExam(req, res) {
  const id = Number(req.params.id);
  const { password } = req.body;

  const exam = await getExamWithPasswordHash(id);
  if (!exam || !exam.is_published) {
    return res.status(404).json({ message: "Exam not found" });
  }

  if (exam.password_hash) {
    const matches = password ? await bcrypt.compare(password, exam.password_hash) : false;
    if (!matches) {
      return res.status(401).json({ message: "Incorrect exam password." });
    }
  }

  let attempt = await getActiveAttempt(id, req.user.id);

  if (attempt) {
    attempt = await enforceExpiry(attempt, exam);
  }

    // One attempt per student per exam: once an attempt has been
  // submitted or has expired, block starting a new one.
  if (!attempt || attempt.status !== "in_progress") {
    const completed = await getCompletedAttempt(id, req.user.id);
    if (completed) {
      return res.status(403).json({
        message: "You have already completed this exam. Only one attempt is allowed.",
        attempt: {
          id: completed.id,
          status: completed.status,
          totalScore: completed.total_score,
          maxScore: completed.max_score,
          submittedAt: completed.submitted_at,
        },
      });
    }
    attempt = await createAttempt(id, req.user.id);
  }

  const questions = await getExamQuestionsForStudent(id);

  res.json({
    attempt: {
      id: attempt.id,
      status: attempt.status,
      startedAt: attempt.started_at,
      remainingSeconds: remainingSeconds(attempt, exam.duration_minutes),
    },
    exam: {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      durationMinutes: exam.duration_minutes,
    },
    questions,
  });
}

// Student polls this to keep an accurate countdown even after a page
// refresh, and to find out (server-side) when time has run out.
export async function getAttemptStatus(req, res) {
  const attemptId = Number(req.params.attemptId);
  const attempt = await getAttemptById(attemptId);

  if (!attempt || attempt.user_id !== req.user.id) {
    return res.status(404).json({ message: "Attempt not found" });
  }

  const exam = await getExamById(attempt.exam_id);
  const current = await enforceExpiry(attempt, exam);

 res.json({
  attempt: {
    id: current.id,
    status: current.status,
    startedAt: current.started_at,
    remainingSeconds: remainingSeconds(
      current,
      exam.duration_minutes
    ),
    resultApproved: current.result_approved,
    totalScore: current.result_approved
      ? current.total_score
      : null,
    maxScore: current.result_approved
      ? current.max_score
      : null,
  },
});
}

// Save a single mcq / true_false / short_answer answer. Coding
// questions are answered through the existing
// /api/challenges/:slug/submit endpoint (unchanged) — the frontend
// links that submission to this attempt via exam_attempt_id.
export async function answerExamQuestion(req, res) {
  const attemptId = Number(req.params.attemptId);
  const { questionId, answer } = req.body;

  const attempt = await getAttemptById(attemptId);
  if (!attempt || attempt.user_id !== req.user.id) {
    return res.status(404).json({ message: "Attempt not found" });
  }

  const exam = await getExamById(attempt.exam_id);
  const current = await enforceExpiry(attempt, exam);

  if (current.status !== "in_progress") {
    return res.status(403).json({ message: "This exam attempt is no longer active. Time may have expired." });
  }

  const question = await getExamQuestionById(Number(questionId));
  if (!question || question.exam_id !== exam.id) {
    return res.status(404).json({ message: "Question not found on this exam" });
  }

  if (question.type === "coding") {
    return res.status(400).json({ message: "Coding questions are answered via Run/Submit, not this endpoint." });
  }

  const { isCorrect, pointsAwarded } = gradeAnswer(question, answer);

  const saved = await upsertExamAnswer({
    examAttemptId: attempt.id,
    examQuestionId: question.id,
    answer: String(answer ?? ""),
    isCorrect,
    pointsAwarded,
  });

  res.json({
    answer: { questionId: question.id, isCorrect: saved.is_correct, pointsAwarded: saved.points_awarded },
    remainingSeconds: remainingSeconds(current, exam.duration_minutes),
  });
}

function gradeAnswer(question, rawAnswer) {
  if (question.type === "mcq") {
    const correct = question.data?.correctOption;
    const isCorrect = String(rawAnswer ?? "").trim() === String(correct ?? "").trim();
    return { isCorrect, pointsAwarded: isCorrect ? question.points : 0 };
  }

  if (question.type === "true_false") {
    const correct = Boolean(question.data?.correctAnswer);
    const submitted = rawAnswer === true || rawAnswer === "true";
    const isCorrect = submitted === correct;
    return { isCorrect, pointsAwarded: isCorrect ? question.points : 0 };
  }

  if (question.type === "short_answer") {
    const expected = String(question.data?.expectedAnswer ?? "").trim().toLowerCase();
    const submitted = String(rawAnswer ?? "").trim().toLowerCase();
    const isCorrect = expected.length > 0 && submitted === expected;
    return { isCorrect, pointsAwarded: isCorrect ? question.points : 0 };
  }

  return { isCorrect: null, pointsAwarded: 0 };
}

// Finish the exam: locks the attempt (submitted, or already expired),
// tallies mcq/true_false/short_answer scores plus already-graded
// coding submissions, and returns a final score. Rejected if the
// attempt already ended, or accepted-but-marked-expired if time was
// already up server-side — either way nothing further can be answered.
// Shared scoring logic used both when a student finishes an exam and
// when an admin later overrides a short-answer grade. Keeping this in
// one place means both paths always compute the score the same way.
async function computeAttemptScore(examId, attemptId) {
  const questions = await getExamQuestionsForAdmin(examId);
  const answers = await getAttemptAnswers(attemptId);
  const codingScores = await getAttemptCodingScore(attemptId);

  let totalScore = 0;
  let maxScore = 0;

  for (const q of questions) {
    maxScore += q.points;

    if (q.type === "coding") {
      const result = codingScores.find((c) => c.exam_question_id === q.id);
      if (result && result.status === "accepted") totalScore += q.points;
    } else {
      const ans = answers.find((a) => a.exam_question_id === q.id);
      if (ans) totalScore += ans.points_awarded;
    }
  }

  return { totalScore, maxScore };
}

export async function finishExam(req, res) {
  const attemptId = Number(req.params.attemptId);
  const attempt = await getAttemptById(attemptId);

  if (!attempt || attempt.user_id !== req.user.id) {
    return res.status(404).json({ message: "Attempt not found" });
  }

  const exam = await getExamById(attempt.exam_id);
  let current = await enforceExpiry(attempt, exam);

  if (current.status === "submitted") {
    return res.status(409).json({ message: "This exam has already been submitted." });
  }

  const { totalScore, maxScore } = await computeAttemptScore(exam.id, attempt.id);

  const finalStatus = current.status === "expired" ? "expired" : "submitted";
  current = await markAttemptStatus(attempt.id, finalStatus, { totalScore, maxScore });

  res.json({
  attempt: {
    id: current.id,
    status: current.status,
    resultApproved: current.result_approved,
    totalScore: null,
    maxScore: null,
    submittedAt: current.submitted_at,
  },
});
}

// -----------------------------------------------------------------------
// ADMIN: MANUALLY OVERRIDE A SHORT-ANSWER GRADE
//
// Exact-string matching is often too strict for free-text answers — a
// student may write something correct that just isn't phrased exactly
// like the stored answer. This lets an admin mark one student's
// short-answer response right/wrong by hand, and immediately
// recomputes + stores the attempt's total score to match.
// -----------------------------------------------------------------------
export async function regradeShortAnswer(req, res) {
  const attemptId = Number(req.params.attemptId);
  const questionId = Number(req.params.questionId);
  const { isCorrect } = req.body || {};

  if (!Number.isInteger(attemptId) || !Number.isInteger(questionId)) {
    return res.status(400).json({ message: "Invalid attempt or question id." });
  }

  if (typeof isCorrect !== "boolean") {
    return res.status(400).json({ message: "isCorrect (true or false) is required." });
  }

  const attempt = await getAttemptById(attemptId);

  if (!attempt) {
    return res.status(404).json({ message: "Attempt not found." });
  }

  if (attempt.status === "in_progress") {
    return res.status(400).json({
      message: "Can't grade an exam the student hasn't submitted yet.",
    });
  }

  const question = await getExamQuestionById(questionId);

  if (!question || question.exam_id !== attempt.exam_id) {
    return res.status(404).json({ message: "Question not found on this exam." });
  }

  if (question.type !== "short_answer") {
    return res.status(400).json({
      message: "Manual grading is only available for short-answer questions.",
    });
  }

  const pointsAwarded = isCorrect ? question.points : 0;

  const updatedAnswer = await updateExamAnswerGrade(attemptId, questionId, {
    isCorrect,
    pointsAwarded,
  });

  if (!updatedAnswer) {
    return res.status(404).json({ message: "The student didn't answer this question." });
  }

  const { totalScore, maxScore } = await computeAttemptScore(
    attempt.exam_id,
    attemptId
  );

  const updatedAttempt = await updateAttemptScore(attemptId, totalScore, maxScore);

  res.json({
    message: "Grade updated.",
    answer: {
      questionId,
      isCorrect: updatedAnswer.is_correct,
      pointsAwarded: updatedAnswer.points_awarded,
    },
    totalScore: updatedAttempt.total_score,
    maxScore: updatedAttempt.max_score,
  });
}

// -----------------------------------------------------------------------
// Admin: see what students have done on this exam
// -----------------------------------------------------------------------

// List every attempt on this exam with each student's score "out of"
// the exam's total points (not XP).
export async function getExamAttemptsForAdmin(req, res) {
  const examId = Number(req.params.id);
  const exam = await getExamById(examId);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  const attempts = await listAttemptsForExam(examId);

  res.json({
    attempts: attempts.map((a) => ({
      id: a.id,
      student: { id: a.user_id, name: a.full_name, username: a.username },
      status: a.status,
      totalScore: a.total_score,
      maxScore: a.max_score,
      resultApproved: a.result_approved,
      startedAt: a.started_at,
      submittedAt: a.submitted_at,
    })),
  });
}
// Full detail of exactly what one student answered/submitted for
// every question on the exam, including coding source code.
export async function getExamAttemptDetailForAdmin(req, res) {
  const attemptId = Number(req.params.attemptId);
  const detail = await getAttemptDetailForAdmin(attemptId);

  if (!detail) return res.status(404).json({ message: "Attempt not found" });

  res.json(detail);
}

// Flat feed of every MCQ / True-False / Short-Answer answer across
// every exam and every student — this is what powers the
// "Submissions" dashboard so exam answers show up there too, not
// just coding submissions. Optional ?studentId=/?examId= filters.
export async function getAllExamAnswers(req, res) {
  const { studentId, examId } = req.query;

  const answers = await listExamAnswersForAdmin({
    userId: studentId ? Number(studentId) : undefined,
    examId: examId ? Number(examId) : undefined,
  });

  res.json({
    answers: answers.map((a) => ({
      id: a.id,
      student: { id: a.user_id, name: a.full_name, username: a.username },
      exam: { id: a.exam_id, title: a.exam_title },
      attemptId: a.attempt_id,
      attemptStatus: a.attempt_status,
      questionId: a.exam_question_id,
      questionType: a.question_type,
      question: a.question,
      studentAnswer: a.answer,
      correctAnswer:
        a.question_type === "mcq" ? a.data?.correctOption
        : a.question_type === "true_false" ? String(a.data?.correctAnswer)
        : a.question_type === "short_answer" ? a.data?.expectedAnswer
        : null,
      isCorrect: a.is_correct,
      score: `${a.points_awarded}/${a.question_points}`, // out of the question, not XP
      answeredAt: a.answered_at,
    })),
  });
}