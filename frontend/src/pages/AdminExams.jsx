import { useEffect, useState } from "react";
import { api } from "../services/api";

const emptyExamForm = {
  title: "",
  description: "",
  durationMinutes: 60,
  password: "",
};

const durationPresets = [15, 30, 45, 60, 90, 120];

function emptyQuestionForm(type) {
  if (type === "mcq") {
    return { type, question: "", options: ["", "", "", ""], correctOption: "", points: 5 };
  }
  if (type === "true_false") {
    return { type, question: "", correctAnswer: "true", points: 2 };
  }
  if (type === "short_answer") {
    return { type, question: "", expectedAnswer: "", points: 3 };
  }
  return { type, challengeId: "", points: 10 }; // coding
}

let rowIdCounter = 0;
function nextRowId() {
  rowIdCounter += 1;
  return rowIdCounter;
}

function emptyNewChallengeForm() {
  return {
    title: "",
    description: "",
    difficulty: "easy",
    category: "",
    xpReward: 100,
    language: "javascript",
    starterCode: `function solve(input) {\n  // Write your solution here\n}`,
  };
}

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [challenges, setChallenges] = useState([]);

  const [examForm, setExamForm] = useState(emptyExamForm);
  const [passwordDraft, setPasswordDraft] = useState("");

  const [qType, setQType] = useState("mcq");
  const [qForm, setQForm] = useState(emptyQuestionForm("mcq"));

  // Repeatable-row multi-add form: several questions (any mix of
  // types) built in the UI and submitted together in one request.
  const [multiRows, setMultiRows] = useState([{ id: nextRowId(), ...emptyQuestionForm("mcq") }]);

  const [bulkJson, setBulkJson] = useState("");
  const [tab, setTab] = useState("questions"); // "questions" | "attempts"
  const [attempts, setAttempts] = useState([]);
  const [attemptDetail, setAttemptDetail] = useState(null);

  // Inline "create a new coding challenge without leaving this page"
  // form, shown next to the coding-question challenge dropdown.
  // Reuses the exact same api.createChallenge() call the Challenges
  // admin page uses — that page itself is never touched.
  const [showNewChallengeForm, setShowNewChallengeForm] = useState(false);
  const [newChallengeForm, setNewChallengeForm] = useState(emptyNewChallengeForm());
  const [newChallengeTestCase, setNewChallengeTestCase] = useState({ input: "", expectedOutput: "" });
  const [creatingChallenge, setCreatingChallenge] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadExams();
    api
      .challenges()
      .then(setChallenges)
      .catch((err) => setError(`Failed to load coding challenges for the dropdown: ${err.message}`));
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

  // Create a brand-new coding challenge right from this page (same
  // endpoint the Challenges admin page uses), then immediately select
  // it in the coding-question dropdown so it's ready to add to the exam.
  async function createChallengeInline(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!newChallengeForm.title.trim()) {
      setError("New challenge needs a title.");
      return;
    }

    setCreatingChallenge(true);
    try {
      const created = await api.createChallenge({
        title: newChallengeForm.title,
        description: newChallengeForm.description,
        difficulty: newChallengeForm.difficulty,
        category: newChallengeForm.category,
        xpReward: Number(newChallengeForm.xpReward) || 100,
        languages: [{ language: newChallengeForm.language, starterCode: newChallengeForm.starterCode }],
        testCases: newChallengeTestCase.expectedOutput.trim()
          ? [{ input: newChallengeTestCase.input, expectedOutput: newChallengeTestCase.expectedOutput, isHidden: false }]
          : [],
      });

      setMessage(`Challenge "${created.title}" created.`);
      setNewChallengeForm(emptyNewChallengeForm());
      setNewChallengeTestCase({ input: "", expectedOutput: "" });
      setShowNewChallengeForm(false);

      const updated = await api.challenges();
      setChallenges(updated);
      setQForm((prev) => ({ ...prev, challengeId: String(created.id) }));
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingChallenge(false);
    }
  }

  // ---------------------------------------------------------------
  // Multi-question form (repeatable rows, any mix of types, one submit)
  // ---------------------------------------------------------------

  function addRow(type = "mcq") {
    setMultiRows((rows) => [...rows, { id: nextRowId(), ...emptyQuestionForm(type) }]);
  }

  function removeRow(rowId) {
    setMultiRows((rows) => (rows.length === 1 ? rows : rows.filter((r) => r.id !== rowId)));
  }

  function updateRow(rowId, patch) {
    setMultiRows((rows) => rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));
  }

  function changeRowType(rowId, type) {
    setMultiRows((rows) => rows.map((r) => (r.id === rowId ? { id: r.id, ...emptyQuestionForm(type) } : r)));
  }

  function duplicateRow(rowId) {
    setMultiRows((rows) => {
      const row = rows.find((r) => r.id === rowId);
      if (!row) return rows;
      const { id, ...rest } = row;
      return [...rows, { id: nextRowId(), ...rest }];
    });
  }

  async function submitMultiRows(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    const prepared = [];

    for (let i = 0; i < multiRows.length; i++) {
      const row = multiRows[i];
      const points = Number(row.points) || 1;

      if (row.type === "mcq") {
        const options = row.options.filter((o) => o.trim() !== "");
        if (!row.question.trim() || options.length < 2 || !row.correctOption) {
          setError(`Row ${i + 1}: fill in the question, at least 2 options, and pick the correct option.`);
          return;
        }
        prepared.push({ type: "mcq", question: row.question, options, correctOption: row.correctOption, points });
      } else if (row.type === "true_false") {
        if (!row.question.trim()) {
          setError(`Row ${i + 1}: question text is required.`);
          return;
        }
        prepared.push({ type: "true_false", question: row.question, correctAnswer: row.correctAnswer === "true", points });
      } else if (row.type === "short_answer") {
        if (!row.question.trim() || !row.expectedAnswer.trim()) {
          setError(`Row ${i + 1}: question and expected answer are required.`);
          return;
        }
        prepared.push({ type: "short_answer", question: row.question, expectedAnswer: row.expectedAnswer, points });
      } else {
        if (!row.challengeId) {
          setError(`Row ${i + 1}: select a coding challenge.`);
          return;
        }
        prepared.push({ type: "coding", challengeId: Number(row.challengeId), points });
      }
    }

    try {
      const created = await api.createExamQuestionsBulk(selectedExamId, prepared);
      setMessage(`${created.length} question(s) added.`);
      setMultiRows([{ id: nextRowId(), ...emptyQuestionForm("mcq") }]);
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

    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(bulkJson);
    } catch {
      setError("That's not valid JSON. Check for a missing comma or bracket.");
      return;
    }

    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      setError("JSON must be a non-empty array of question objects.");
      return;
    }

    try {
      const created = await api.createExamQuestionsBulk(selectedExamId, parsedQuestions);
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

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">MANAGE EXAMS</h1>

      {error && <div className="mb-4 border border-red-500/30 bg-red-500/5 text-red-400 p-3 text-sm">{error}</div>}
      {message && <div className="mb-4 border border-green-500/30 bg-green-500/5 text-green-400 p-3 text-sm">{message}</div>}

      <div className="grid xl:grid-cols-3 gap-6">
        {/* Create exam */}
        <form onSubmit={createExam} className="xl:col-span-1 border border-gray-800 bg-[#0d1117] p-6 space-y-3 h-fit">
          <h2 className="text-white font-bold mb-2">CREATE EXAM</h2>

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
            <label className="block text-xs text-gray-500 font-mono mb-2">DURATION (MINUTES)</label>
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
            <label className="block text-xs text-gray-500 font-mono mb-2">EXAM PASSWORD (OPTIONAL)</label>
            <input
              type="text"
              placeholder="Leave blank for no password"
              value={examForm.password}
              onChange={(e) => setExamForm({ ...examForm, password: e.target.value })}
              className="input"
            />
          </div>

          <button className="w-full mt-2 bg-cyan-400 text-black font-bold py-3 hover:bg-cyan-300">
            CREATE EXAM
          </button>
        </form>

        {/* Exam list */}
        <div className="xl:col-span-2 border border-gray-800 bg-[#0d1117] overflow-x-auto h-fit">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800">
              <tr className="text-left text-gray-500 font-mono text-xs">
                <th className="p-4">TITLE</th>
                <th className="p-4">DURATION</th>
                <th className="p-4">PASSWORD</th>
                <th className="p-4">STATUS</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id} className={`border-b border-gray-800 ${selectedExamId === exam.id ? "bg-cyan-400/5" : ""}`}>
                  <td className="p-4 text-white cursor-pointer" onClick={() => setSelectedExamId(exam.id)}>
                    {exam.title}
                  </td>
                  <td className="p-4 text-gray-400">
                    <input
                      type="number"
                      min="1"
                      defaultValue={exam.duration_minutes}
                      className="input w-20 py-1"
                      onBlur={(e) => e.target.value != exam.duration_minutes && saveDuration(exam, e.target.value)}
                    />{" "}
                    min
                  </td>
                  <td className="p-4 text-gray-400">{exam.has_password ? "🔒 Set" : "Open"}</td>
                  <td className="p-4">
                    <button
                      onClick={() => togglePublish(exam)}
                      className={`text-xs font-mono ${exam.is_published ? "text-green-400" : "text-gray-500"}`}
                    >
                      {exam.is_published ? "PUBLISHED" : "DRAFT"}
                    </button>
                  </td>
                  <td className="p-4">
                    <button onClick={() => deleteExam(exam.id)} className="text-xs text-red-400 hover:underline">
                      DELETE
                    </button>
                  </td>
                </tr>
              ))}
              {exams.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">No exams yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedExam && (
        <div className="mt-8 border border-gray-800 bg-[#0d1117] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold">
              {selectedExam.title}
            </h2>

            <div className="flex gap-2">
              <button
                onClick={() => setTab("questions")}
                className={`text-xs font-mono px-3 py-1.5 border ${
                  tab === "questions" ? "bg-cyan-400 text-black border-cyan-400" : "text-gray-400 border-gray-700"
                }`}
              >
                QUESTIONS
              </button>
              <button
                onClick={() => setTab("attempts")}
                className={`text-xs font-mono px-3 py-1.5 border ${
                  tab === "attempts" ? "bg-cyan-400 text-black border-cyan-400" : "text-gray-400 border-gray-700"
                }`}
              >
                STUDENT ATTEMPTS
              </button>
            </div>
          </div>

          {tab === "attempts" ? (
            <ExamAttemptsPanel attempts={attempts} attemptDetail={attemptDetail} onOpenAttempt={openAttempt} />
          ) : (
          <>
          {/* Change password */}
          <div className="mb-6 flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 font-mono mb-2">
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
              className="bg-gray-800 text-white text-sm font-mono px-4 py-3 hover:bg-gray-700"
            >
              SAVE PASSWORD
            </button>
          </div>

          {/* Question type selector + form (single question) */}
          <form onSubmit={addQuestion} className="border border-gray-800 p-4 mb-6 space-y-3">
            <label className="block text-xs text-gray-500 font-mono mb-2">ADD ONE QUESTION</label>
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
              <div className="space-y-2">
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

                <button
                  type="button"
                  onClick={() => setShowNewChallengeForm((v) => !v)}
                  className="text-xs text-cyan-400 hover:underline font-mono"
                >
                  {showNewChallengeForm ? "− Cancel new challenge" : "+ New Challenge (don't leave this page)"}
                </button>

                {showNewChallengeForm && (
                  <div className="border border-cyan-400/30 bg-cyan-400/5 p-3 space-y-2">
                    <input
                      placeholder="Challenge title"
                      value={newChallengeForm.title}
                      onChange={(e) => setNewChallengeForm({ ...newChallengeForm, title: e.target.value })}
                      className="input"
                    />

                    <div>
                      <label className="block text-xs text-gray-500 font-mono mb-2">PROGRAMMING LANGUAGE</label>
                      <select
                        value={newChallengeForm.language}
                        onChange={(e) => {
                          const language = e.target.value;
                          const starterCodes = {
                            javascript: `function solve(input) {\n  // Write your solution here\n}`,
                            python: `def solve(input):\n    # Write your solution here\n    pass`,
                            cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
                          };
                          setNewChallengeForm({
                            ...newChallengeForm,
                            language,
                            starterCode: starterCodes[language],
                          });
                        }}
                        className="input"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                      </select>
                    </div>

                    <textarea
                      placeholder="Description"
                      value={newChallengeForm.description}
                      onChange={(e) => setNewChallengeForm({ ...newChallengeForm, description: e.target.value })}
                      className="input min-h-16"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newChallengeForm.difficulty}
                        onChange={(e) => setNewChallengeForm({ ...newChallengeForm, difficulty: e.target.value })}
                        className="input"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                      <input
                        placeholder="Category"
                        value={newChallengeForm.category}
                        onChange={(e) => setNewChallengeForm({ ...newChallengeForm, category: e.target.value })}
                        className="input"
                      />
                    </div>
                    <textarea
                      placeholder="Starter code"
                      value={newChallengeForm.starterCode}
                      onChange={(e) => setNewChallengeForm({ ...newChallengeForm, starterCode: e.target.value })}
                      className="input min-h-20 font-mono text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="Test input (optional)"
                        value={newChallengeTestCase.input}
                        onChange={(e) => setNewChallengeTestCase({ ...newChallengeTestCase, input: e.target.value })}
                        className="input"
                      />
                      <input
                        placeholder="Expected output"
                        value={newChallengeTestCase.expectedOutput}
                        onChange={(e) => setNewChallengeTestCase({ ...newChallengeTestCase, expectedOutput: e.target.value })}
                        className="input"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={createChallengeInline}
                      disabled={creatingChallenge}
                      className="w-full bg-cyan-400 text-black font-bold py-2 hover:bg-cyan-300 disabled:opacity-50"
                    >
                      {creatingChallenge ? "CREATING..." : "CREATE & SELECT THIS CHALLENGE"}
                    </button>
                  </div>
                )}
              </div>
            )}

            <input
              type="number"
              min="1"
              placeholder="Points"
              value={qForm.points}
              onChange={(e) => setQForm({ ...qForm, points: e.target.value })}
              className="input"
            />

            <button className="w-full bg-cyan-400 text-black font-bold py-2 hover:bg-cyan-300">
              + ADD QUESTION
            </button>
          </form>

          {/* Add multiple questions at once (repeatable rows, no JSON needed) */}
          <form onSubmit={submitMultiRows} className="border border-gray-800 p-4 mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs text-gray-500 font-mono">
                ADD MULTIPLE QUESTIONS AT ONCE
              </label>
              <span className="text-xs text-gray-600 font-mono">{multiRows.length} row(s)</span>
            </div>

            <div className="space-y-4">
              {multiRows.map((row, i) => (
                <div key={row.id} className="border border-gray-800 p-3 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-mono">QUESTION {i + 1}</span>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => duplicateRow(row.id)}
                        className="text-xs text-gray-400 hover:text-white"
                      >
                        DUPLICATE
                      </button>
                      {multiRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="text-xs text-red-400 hover:underline"
                        >
                          REMOVE
                        </button>
                      )}
                    </div>
                  </div>

                  <select
                    value={row.type}
                    onChange={(e) => changeRowType(row.id, e.target.value)}
                    className="input"
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="true_false">True / False</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="coding">Coding</option>
                  </select>

                  {row.type !== "coding" && (
                    <textarea
                      placeholder="Question"
                      value={row.question}
                      onChange={(e) => updateRow(row.id, { question: e.target.value })}
                      className="input min-h-14"
                    />
                  )}

                  {row.type === "mcq" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {row.options.map((opt, oi) => (
                          <input
                            key={oi}
                            placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                            value={opt}
                            onChange={(e) => {
                              const options = [...row.options];
                              options[oi] = e.target.value;
                              updateRow(row.id, { options });
                            }}
                            className="input"
                          />
                        ))}
                      </div>
                      <select
                        value={row.correctOption}
                        onChange={(e) => updateRow(row.id, { correctOption: e.target.value })}
                        className="input"
                      >
                        <option value="">Correct option...</option>
                        {row.options.filter((o) => o.trim()).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {row.type === "true_false" && (
                    <select
                      value={row.correctAnswer}
                      onChange={(e) => updateRow(row.id, { correctAnswer: e.target.value })}
                      className="input"
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  )}

                  {row.type === "short_answer" && (
                    <input
                      placeholder="Expected answer"
                      value={row.expectedAnswer}
                      onChange={(e) => updateRow(row.id, { expectedAnswer: e.target.value })}
                      className="input"
                    />
                  )}

                  {row.type === "coding" && (
                    <select
                      value={row.challengeId}
                      onChange={(e) => updateRow(row.id, { challengeId: e.target.value })}
                      className="input"
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
                    value={row.points}
                    onChange={(e) => updateRow(row.id, { points: e.target.value })}
                    className="input w-32"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addRow(qType)}
                className="flex-1 border border-gray-700 text-gray-300 text-sm font-mono py-2 hover:bg-gray-800"
              >
                + ADD ANOTHER QUESTION ROW
              </button>
              <button className="flex-1 bg-cyan-400 text-black font-bold py-2 hover:bg-cyan-300">
                SUBMIT ALL ({multiRows.length})
              </button>
            </div>
          </form>

          {/* Bulk import (paste a whole exam's worth of questions as JSON) */}
          <form onSubmit={bulkImportQuestions} className="border border-gray-800 p-4 mb-6 space-y-3">
            <label className="block text-xs text-gray-500 font-mono mb-2">
              BULK IMPORT (PASTE JSON ARRAY OF QUESTIONS)
            </label>
            <textarea
              placeholder={`[\n  { "type": "mcq", "question": "2 + 2 = ?", "options": ["3","4","5"], "correctOption": "4", "points": 5 },\n  { "type": "true_false", "question": "JS is compiled.", "correctAnswer": false, "points": 2 },\n  { "type": "short_answer", "question": "Capital of France?", "expectedAnswer": "Paris", "points": 3 },\n  { "type": "coding", "challengeId": 7, "points": 10 }\n]`}
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              className="input min-h-40 font-mono text-xs"
            />
            <button className="w-full bg-gray-800 text-white font-bold py-2 hover:bg-gray-700">
              IMPORT ALL
            </button>
          </form>

          {/* Existing questions */}
          <div className="space-y-2">
            {questions.map((q) => (
              <div key={q.id} className="flex items-center justify-between border border-gray-800 p-3">
                <div>
                  <span className="text-xs text-cyan-400 font-mono uppercase mr-2">{q.type.replace("_", " ")}</span>
                  <span className="text-white">{q.type === "coding" ? q.challenge_title : q.question}</span>
                  <span className="text-gray-500 text-xs ml-2">({q.points} pts)</span>
                </div>
                <button onClick={() => removeQuestion(q.id)} className="text-xs text-red-400 hover:underline">
                  REMOVE
                </button>
              </div>
            ))}
            {questions.length === 0 && <p className="text-gray-500 text-sm">No questions yet.</p>}
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
function ExamAttemptsPanel({ attempts, attemptDetail, onOpenAttempt }) {
  return (
    <div className="grid xl:grid-cols-2 gap-6">
      <div className="border border-gray-800 overflow-x-auto h-fit">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr className="text-left text-gray-500 font-mono text-xs">
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
                className={`border-b border-gray-800 ${attemptDetail?.attempt?.id === a.id ? "bg-cyan-400/5" : ""}`}
              >
                <td className="p-4 text-white">{a.student.name || a.student.username}</td>
                <td className="p-4 text-cyan-400 font-mono">
                  {a.totalScore ?? "—"}{a.maxScore != null ? ` / ${a.maxScore}` : ""}
                </td>
                <td className="p-4">
                  <span
                    className={`text-xs font-mono px-2 py-1 border ${
                      a.status === "submitted"
                        ? "text-green-400 border-green-400/30"
                        : a.status === "expired"
                        ? "text-yellow-400 border-yellow-400/30"
                        : "text-gray-400 border-gray-500/30"
                    }`}
                  >
                    {a.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="p-4">
                  <button onClick={() => onOpenAttempt(a.id)} className="text-xs text-cyan-400 hover:underline">
                    VIEW
                  </button>
                </td>
              </tr>
            ))}
            {attempts.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-gray-500">No attempts yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border border-gray-800 p-6 h-fit">
        {!attemptDetail ? (
          <p className="text-gray-500 text-sm">Select a student's attempt to see exactly what they answered.</p>
        ) : (
          <div>
            <div className="mb-4">
              <h3 className="text-white font-bold">
                {attemptDetail.attempt.student.name || attemptDetail.attempt.student.username}
              </h3>
              <p className="text-xs text-gray-500 font-mono mt-1">
                {attemptDetail.attempt.totalScore ?? "—"} / {attemptDetail.attempt.maxScore ?? "—"} points ·{" "}
                {attemptDetail.attempt.status.replace(/_/g, " ")}
              </p>
            </div>

            <div className="space-y-3">
              {attemptDetail.questions.map((q) => (
                <div key={q.questionId} className="border border-gray-800 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-cyan-400 font-mono uppercase">{q.type.replace("_", " ")}</span>
                    <span className="text-xs text-gray-500 font-mono">
                      {q.pointsAwarded}/{q.points} pts
                    </span>
                  </div>
                  <p className="text-white text-sm mb-2">{q.question}</p>

                  {q.type === "coding" ? (
                    <>
                      <p className="text-xs text-gray-500 font-mono mb-1">
                        {q.score} · {q.status.replace(/_/g, " ")} · {q.studentLanguage || "no submission"}
                      </p>
                      {q.studentSourceCode && (
                        <pre className="text-xs text-gray-300 bg-[#07090d] border border-gray-800 p-3 overflow-x-auto whitespace-pre-wrap">
                          {q.studentSourceCode}
                        </pre>
                      )}
                    </>
                  ) : (
                    <p className={`text-xs font-mono ${q.isCorrect ? "text-green-400" : "text-red-400"}`}>
                      Student answered: {q.studentAnswer ?? "(no answer)"}
                      {q.isCorrect === false && (
                        <span className="text-gray-500">
                          {" "}
                          — correct: {JSON.stringify(q.correctAnswer)}
                        </span>
                      )}
                    </p>
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