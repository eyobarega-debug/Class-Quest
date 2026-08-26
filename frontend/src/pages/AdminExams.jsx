import { useEffect, useState } from "react";
import { api } from "../services/api";

const emptyExamForm = {
  title: "",
  description: "",
  durationMinutes: 60,
  password: "",
};

const durationPresets = [15, 30, 45, 60, 90, 120];

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [challenges, setChallenges] = useState([]);

  const [examForm, setExamForm] = useState(emptyExamForm);
  const [passwordDraft, setPasswordDraft] = useState("");

  const [qType, setQType] = useState("mcq");
  const [qForm, setQForm] = useState(emptyQuestionForm("mcq"));

  const [bulkJson, setBulkJson] = useState("");
  const [tab, setTab] = useState("questions"); // "questions" | "attempts"
  const [attempts, setAttempts] = useState([]);
  const [attemptDetail, setAttemptDetail] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadExams();
    api.challenges().then(setChallenges).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      loadExamDetail(selectedExamId);
      setAttemptDetail(null);
      if (tab === "attempts") loadAttempts(selectedExamId);
    }
  }, [selectedExamId, tab]);

  async function loadExams() {
    try {
      setExams(await api.exams());
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadExamDetail(id) {
    try {
      const data = await api.exam(id);
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err.message);
    }
  }

  function emptyQuestionForm(type) {
    if (type === "mcq") {
      return { question: "", options: ["", "", "", ""], correctOption: "", points: 5 };
    }
    if (type === "true_false") {
      return { question: "", correctAnswer: "true", points: 2 };
    }
    if (type === "short_answer") {
      return { question: "", expectedAnswer: "", points: 3 };
    }
    return { challengeId: "", points: 10 }; // coding
  }

  function changeQType(type) {
    setQType(type);
    setQForm(emptyQuestionForm(type));
  }

  async function createExam(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const exam = await api.createExam({
        title: examForm.title,
        description: examForm.description,
        durationMinutes: Number(examForm.durationMinutes),
        password: examForm.password || undefined,
      });
      setMessage("Exam created.");
      setExamForm(emptyExamForm);
      await loadExams();
      setSelectedExamId(exam.id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function togglePublish(exam) {
    setError("");
    try {
      await api.updateExam(exam.id, { isPublished: !exam.is_published });
      loadExams();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveDuration(exam, minutes) {
    setError("");
    try {
      await api.updateExam(exam.id, { durationMinutes: Number(minutes) });
      loadExams();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveExamPassword(examId) {
    setError("");
    setMessage("");
    try {
      await api.changeExamPassword(examId, passwordDraft);
      setMessage(passwordDraft ? "Password updated." : "Password removed — exam is now open.");
      setPasswordDraft("");
      loadExams();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteExam(id) {
    setError("");
    try {
      await api.deleteExam(id);
      if (selectedExamId === id) setSelectedExamId(null);
      loadExams();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addQuestion(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const payload = { type: qType, points: Number(qForm.points) || 1 };

      if (qType === "mcq") {
        Object.assign(payload, {
          question: qForm.question,
          options: qForm.options.filter((o) => o.trim() !== ""),
          correctOption: qForm.correctOption,
        });
      } else if (qType === "true_false") {
        Object.assign(payload, {
          question: qForm.question,
          correctAnswer: qForm.correctAnswer === "true",
        });
      } else if (qType === "short_answer") {
        Object.assign(payload, {
          question: qForm.question,
          expectedAnswer: qForm.expectedAnswer,
        });
      } else {
        Object.assign(payload, { challengeId: Number(qForm.challengeId) });
      }

      await api.createExamQuestion(selectedExamId, payload);
      setMessage("Question added.");
      setQForm(emptyQuestionForm(qType));
      loadExamDetail(selectedExamId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeQuestion(questionId) {
    setError("");
    try {
      await api.deleteExamQuestion(selectedExamId, questionId);
      loadExamDetail(selectedExamId);
    } catch (err) {
      setError(err.message);
    }
  }

  // Paste a whole exam's worth of questions as one JSON array, e.g.:
  // [
  //   { "type": "mcq", "question": "2 + 2 = ?", "options": ["3","4","5"], "correctOption": "4", "points": 5 },
  //   { "type": "true_false", "question": "JS is compiled.", "correctAnswer": false, "points": 2 },
  //   { "type": "short_answer", "question": "Capital of France?", "expectedAnswer": "Paris", "points": 3 },
  //   { "type": "coding", "challengeId": 7, "points": 10 }
  // ]
  async function bulkImportQuestions(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    let questions;
    try {
      questions = JSON.parse(bulkJson);
    } catch {
      setError("That's not valid JSON. Check for a missing comma or bracket.");
      return;
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      setError("JSON must be a non-empty array of question objects.");
      return;
    }

    try {
      const created = await api.createExamQuestionsBulk(selectedExamId, questions);
      setMessage(`${created.length} question(s) added.`);
      setBulkJson("");
      loadExamDetail(selectedExamId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadAttempts(examId) {
    setError("");
    try {
      setAttempts(await api.examAttempts(examId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function openAttempt(attemptId) {
    setError("");
    try {
      setAttemptDetail(await api.examAttemptDetail(attemptId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function gradeAnswer(attemptId, questionId, isCorrect) {
    setError("");
    setMessage("");

    try {
      await api.gradeShortAnswer(attemptId, questionId, isCorrect);

      // Refresh both the detail panel (so the change is visible right
      // away) and the attempts list (so the updated score shows there too).
      setAttemptDetail(await api.examAttemptDetail(attemptId));
      setAttempts(await api.examAttempts(selectedExamId));

      setMessage("Grade updated.");
    } catch (err) {
      setError(err.message);
    }
  }

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--color-ink)] mb-8">MANAGE EXAMS</h1>

      {error && <div className="mb-4 border border-[var(--color-red)]/30 bg-[var(--color-red)]/5 text-[var(--color-red-dark)] p-3 text-sm">{error}</div>}
      {message && <div className="mb-4 border border-[var(--color-teal)]/30 bg-[var(--color-teal)]/5 text-[var(--color-teal-dark)] p-3 text-sm">{message}</div>}

      <div className="grid xl:grid-cols-3 gap-6">
        {/* Create exam */}
        <form onSubmit={createExam} className="xl:col-span-1 ledger-card p-6 space-y-3 h-fit">
          <h2 className="text-[var(--color-ink)] font-bold mb-2">CREATE EXAM</h2>

          <input
            placeholder="Exam title"
            value={examForm.title}
            onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
            className="input"
            required
          />

          <textarea
            placeholder="Description"
            value={examForm.description}
            onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
            className="input min-h-20"
          />

          <div>
            <label className="block text-xs text-[var(--color-ink-muted)] font-mono mb-2">DURATION (MINUTES)</label>
            <select
              value={examForm.durationMinutes}
              onChange={(e) => setExamForm({ ...examForm, durationMinutes: e.target.value })}
              className="input"
            >
              {durationPresets.map((m) => (
                <option key={m} value={m}>{m} minutes</option>
              ))}
              <option value={examForm.durationMinutes}>Custom: {examForm.durationMinutes}</option>
            </select>
            <input
              type="number"
              min="1"
              placeholder="Custom minutes"
              value={examForm.durationMinutes}
              onChange={(e) => setExamForm({ ...examForm, durationMinutes: e.target.value })}
              className="input mt-2"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--color-ink-muted)] font-mono mb-2">EXAM PASSWORD (OPTIONAL)</label>
            <input
              type="text"
              placeholder="Leave blank for no password"
              value={examForm.password}
              onChange={(e) => setExamForm({ ...examForm, password: e.target.value })}
              className="input"
            />
          </div>

          <button className="w-full mt-2 bg-[var(--color-brass)] text-[var(--color-vellum)] font-bold py-3 hover:bg-[var(--color-brass-dark)]">
            CREATE EXAM
          </button>
        </form>

        {/* Exam list */}
        <div className="xl:col-span-2 ledger-card overflow-x-auto h-fit">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-line)]">
              <tr className="text-left text-[var(--color-ink-muted)] font-mono text-xs">
                <th className="p-4">TITLE</th>
                <th className="p-4">DURATION</th>
                <th className="p-4">PASSWORD</th>
                <th className="p-4">STATUS</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id} className={`border-b border-[var(--color-line)] ${selectedExamId === exam.id ? "bg-[var(--color-brass)]/5" : ""}`}>
                  <td className="p-4 text-[var(--color-ink)] cursor-pointer" onClick={() => setSelectedExamId(exam.id)}>
                    {exam.title}
                  </td>
                  <td className="p-4 text-[var(--color-ink-muted)]">
                    <input
                      type="number"
                      min="1"
                      defaultValue={exam.duration_minutes}
                      className="input w-20 py-1"
                      onBlur={(e) => e.target.value != exam.duration_minutes && saveDuration(exam, e.target.value)}
                    />{" "}
                    min
                  </td>
                  <td className="p-4 text-[var(--color-ink-muted)]">{exam.has_password ? "🔒 Set" : "Open"}</td>
                  <td className="p-4">
                    <button
                      onClick={() => togglePublish(exam)}
                      className={`text-xs font-mono ${exam.is_published ? "text-[var(--color-teal-dark)]" : "text-[var(--color-ink-muted)]"}`}
                    >
                      {exam.is_published ? "PUBLISHED" : "DRAFT"}
                    </button>
                  </td>
                  <td className="p-4">
                    <button onClick={() => deleteExam(exam.id)} className="text-xs text-[var(--color-red-dark)] hover:underline">
                      DELETE
                    </button>
                  </td>
                </tr>
              ))}
              {exams.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-[var(--color-ink-muted)]">No exams yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedExam && (
        <div className="mt-8 ledger-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[var(--color-ink)] font-bold">
              {selectedExam.title}
            </h2>

            <div className="flex gap-2">
              <button
                onClick={() => setTab("questions")}
                className={`text-xs font-mono px-3 py-1.5 border ${
                  tab === "questions" ? "bg-[var(--color-brass)] text-[var(--color-vellum)] border-[var(--color-brass)]" : "text-[var(--color-ink-muted)] border-[var(--color-line-strong)]"
                }`}
              >
                QUESTIONS
              </button>
              <button
                onClick={() => setTab("attempts")}
                className={`text-xs font-mono px-3 py-1.5 border ${
                  tab === "attempts" ? "bg-[var(--color-brass)] text-[var(--color-vellum)] border-[var(--color-brass)]" : "text-[var(--color-ink-muted)] border-[var(--color-line-strong)]"
                }`}
              >
                STUDENT ATTEMPTS
              </button>
            </div>
          </div>

          {tab === "attempts" ? (
            <ExamAttemptsPanel attempts={attempts} attemptDetail={attemptDetail} onOpenAttempt={openAttempt} onGradeAnswer={gradeAnswer} />
          ) : (
          <>
          {/* Change password */}
          <div className="mb-6 flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs text-[var(--color-ink-muted)] font-mono mb-2">
                {selectedExam.has_password ? "CHANGE EXAM PASSWORD" : "SET EXAM PASSWORD"}
              </label>
              <input
                type="text"
                placeholder="New password (blank = remove password)"
                value={passwordDraft}
                onChange={(e) => setPasswordDraft(e.target.value)}
                className="input"
              />
            </div>
            <button
              onClick={() => saveExamPassword(selectedExam.id)}
              className="bg-[var(--color-vellum-deep)] text-[var(--color-ink)] text-sm font-mono px-4 py-3 hover:bg-[var(--color-line-strong)]"
            >
              SAVE PASSWORD
            </button>
          </div>

          {/* Question type selector + form */}
          <form onSubmit={addQuestion} className="border border-[var(--color-line)] p-4 mb-6 space-y-3">
            <label className="block text-xs text-[var(--color-ink-muted)] font-mono mb-2">QUESTION TYPE</label>
            <select value={qType} onChange={(e) => changeQType(e.target.value)} className="input">
              <option value="mcq">Multiple Choice</option>
              <option value="true_false">True / False</option>
              <option value="short_answer">Short Answer</option>
              <option value="coding">Coding</option>
            </select>

            {qType !== "coding" && (
              <textarea
                placeholder="Question"
                value={qForm.question}
                onChange={(e) => setQForm({ ...qForm, question: e.target.value })}
                className="input min-h-16"
                required
              />
            )}

            {qType === "mcq" && (
              <div className="space-y-2">
                {qForm.options.map((opt, i) => (
                  <input
                    key={i}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    value={opt}
                    onChange={(e) => {
                      const options = [...qForm.options];
                      options[i] = e.target.value;
                      setQForm({ ...qForm, options });
                    }}
                    className="input"
                  />
                ))}
                <select
                  value={qForm.correctOption}
                  onChange={(e) => setQForm({ ...qForm, correctOption: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Correct option...</option>
                  {qForm.options.filter((o) => o.trim()).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}

            {qType === "true_false" && (
              <select
                value={qForm.correctAnswer}
                onChange={(e) => setQForm({ ...qForm, correctAnswer: e.target.value })}
                className="input"
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            )}

            {qType === "short_answer" && (
              <input
                placeholder="Expected answer"
                value={qForm.expectedAnswer}
                onChange={(e) => setQForm({ ...qForm, expectedAnswer: e.target.value })}
                className="input"
                required
              />
            )}

            {qType === "coding" && (
              <select
                value={qForm.challengeId}
                onChange={(e) => setQForm({ ...qForm, challengeId: e.target.value })}
                className="input"
                required
              >
                <option value="">Select existing coding challenge...</option>
                {challenges.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            )}

            <input
              type="number"
              min="1"
              placeholder="Points"
              value={qForm.points}
              onChange={(e) => setQForm({ ...qForm, points: e.target.value })}
              className="input"
            />

            <button className="w-full bg-[var(--color-brass)] text-[var(--color-vellum)] font-bold py-2 hover:bg-[var(--color-brass-dark)]">
              + ADD QUESTION
            </button>
          </form>

          {/* Bulk import (paste a whole exam's worth of questions as JSON) */}
          <form onSubmit={bulkImportQuestions} className="border border-[var(--color-line)] p-4 mb-6 space-y-3">
            <label className="block text-xs text-[var(--color-ink-muted)] font-mono mb-2">
              BULK IMPORT (PASTE JSON ARRAY OF QUESTIONS)
            </label>
            <textarea
              placeholder={`[\n  { "type": "mcq", "question": "2 + 2 = ?", "options": ["3","4","5"], "correctOption": "4", "points": 5 },\n  { "type": "true_false", "question": "JS is compiled.", "correctAnswer": false, "points": 2 },\n  { "type": "short_answer", "question": "Capital of France?", "expectedAnswer": "Paris", "points": 3 },\n  { "type": "coding", "challengeId": 7, "points": 10 }\n]`}
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              className="input min-h-40 font-mono text-xs"
            />
            <button className="w-full bg-[var(--color-vellum-deep)] text-[var(--color-ink)] font-bold py-2 hover:bg-[var(--color-line-strong)]">
              IMPORT ALL
            </button>
          </form>

          {/* Existing questions */}
          <div className="space-y-2">
            {questions.map((q) => (
              <div key={q.id} className="flex items-center justify-between border border-[var(--color-line)] p-3">
                <div>
                  <span className="text-xs text-[var(--color-brass-dark)] font-mono uppercase mr-2">{q.type.replace("_", " ")}</span>
                  <span className="text-[var(--color-ink)]">{q.type === "coding" ? q.challenge_title : q.question}</span>
                  <span className="text-[var(--color-ink-muted)] text-xs ml-2">({q.points} pts)</span>
                </div>
                <button onClick={() => removeQuestion(q.id)} className="text-xs text-[var(--color-red-dark)] hover:underline">
                  REMOVE
                </button>
              </div>
            ))}
            {questions.length === 0 && <p className="text-[var(--color-ink-muted)] text-sm">No questions yet.</p>}
          </div>
          </>
          )}
        </div>
      )}
    </div>
  );
}

// Admin view of every student's attempt on the selected exam: a list
// with score "out of" the exam's total points (not XP), and a click-
// through detail panel showing exactly what the student answered for
// every question (including their coding source code).
function ExamAttemptsPanel({ attempts, attemptDetail, onOpenAttempt, onGradeAnswer }) {
  return (
    <div className="grid xl:grid-cols-2 gap-6">
      <div className="border border-[var(--color-line)] overflow-x-auto h-fit">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-line)]">
            <tr className="text-left text-[var(--color-ink-muted)] font-mono text-xs">
              <th className="p-4">STUDENT</th>
              <th className="p-4">SCORE</th>
              <th className="p-4">STATUS</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a) => (
              <tr
                key={a.id}
                className={`border-b border-[var(--color-line)] ${attemptDetail?.attempt?.id === a.id ? "bg-[var(--color-brass)]/5" : ""}`}
              >
                <td className="p-4 text-[var(--color-ink)]">{a.student.name || a.student.username}</td>
                <td className="p-4 text-[var(--color-brass-dark)] font-mono">
                  {a.totalScore ?? "—"}{a.maxScore != null ? ` / ${a.maxScore}` : ""}
                </td>
                <td className="p-4">
                  <span
                    className={`text-xs font-mono px-2 py-1 border ${
                      a.status === "submitted"
                        ? "text-[var(--color-teal-dark)] border-[var(--color-teal)]/40"
                        : a.status === "expired"
                        ? "text-[var(--color-brass-dark)] border-[var(--color-brass)]/40"
                        : "text-[var(--color-ink-muted)] border-[var(--color-line-strong)]"
                    }`}
                  >
                    {a.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="p-4">
                  <button onClick={() => onOpenAttempt(a.id)} className="text-xs text-[var(--color-brass-dark)] hover:underline">
                    VIEW
                  </button>
                </td>
              </tr>
            ))}
            {attempts.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-[var(--color-ink-muted)]">No attempts yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border border-[var(--color-line)] p-6 h-fit">
        {!attemptDetail ? (
          <p className="text-[var(--color-ink-muted)] text-sm">Select a student's attempt to see exactly what they answered.</p>
        ) : (
          <div>
            <div className="mb-4">
              <h3 className="text-[var(--color-ink)] font-bold">
                {attemptDetail.attempt.student.name || attemptDetail.attempt.student.username}
              </h3>
              <p className="text-xs text-[var(--color-ink-muted)] font-mono mt-1">
                {attemptDetail.attempt.totalScore ?? "—"} / {attemptDetail.attempt.maxScore ?? "—"} points ·{" "}
                {attemptDetail.attempt.status.replace(/_/g, " ")}
              </p>
            </div>

            <div className="space-y-3">
              {attemptDetail.questions.map((q) => (
                <div key={q.questionId} className="border border-[var(--color-line)] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--color-brass-dark)] font-mono uppercase">{q.type.replace("_", " ")}</span>
                    <span className="text-xs text-[var(--color-ink-muted)] font-mono">
                      {q.pointsAwarded}/{q.points} pts
                    </span>
                  </div>
                  <p className="text-[var(--color-ink)] text-sm mb-2">{q.question}</p>

                  {q.type === "coding" ? (
                    <>
                      <p className="text-xs text-[var(--color-ink-muted)] font-mono mb-1">
                        {q.score} · {q.status.replace(/_/g, " ")} · {q.studentLanguage || "no submission"}
                      </p>
                      {q.studentSourceCode && (
                        <pre className="text-xs text-[#e7dcc8] bg-[#1c1712] border border-[#3a3025] p-3 overflow-x-auto whitespace-pre-wrap">
                          {q.studentSourceCode}
                        </pre>
                      )}
                    </>
                  ) : (
                    <div>
                      <p className={`text-xs font-mono ${q.isCorrect ? "text-[var(--color-teal-dark)]" : "text-[var(--color-red-dark)]"}`}>
                        Student answered: {q.studentAnswer ?? "(no answer)"}
                        {q.isCorrect === false && (
                          <span className="text-[var(--color-ink-muted)]">
                            {" "}
                            — correct: {JSON.stringify(q.correctAnswer)}
                          </span>
                        )}
                      </p>

                      {q.type === "short_answer" && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-[var(--color-ink-faint)] font-mono uppercase mr-1">
                            Override:
                          </span>
                          <button
                            type="button"
                            onClick={() => onGradeAnswer(attemptDetail.attempt.id, q.questionId, true)}
                            className={`text-[10px] font-mono px-2 py-1 border ${
                              q.isCorrect
                                ? "bg-[var(--color-teal)]/15 border-[var(--color-teal)]/40 text-[var(--color-teal-dark)]"
                                : "border-[var(--color-line-strong)] text-[var(--color-ink-muted)] hover:border-[var(--color-teal)]/50 hover:text-[var(--color-teal-dark)]"
                            }`}
                          >
                            ✓ MARK CORRECT
                          </button>
                          <button
                            type="button"
                            onClick={() => onGradeAnswer(attemptDetail.attempt.id, q.questionId, false)}
                            className={`text-[10px] font-mono px-2 py-1 border ${
                              q.isCorrect === false
                                ? "bg-[var(--color-red)]/15 border-[var(--color-red)]/40 text-[var(--color-red-dark)]"
                                : "border-[var(--color-line-strong)] text-[var(--color-ink-muted)] hover:border-[var(--color-red)]/50 hover:text-[var(--color-red-dark)]"
                            }`}
                          >
                            ✕ MARK WRONG
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}