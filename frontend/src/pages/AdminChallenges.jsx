import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

const emptyTestCase = { input: "", expectedOutput: "", isHidden: false };

const starterCodes = {
  javascript: `function solve(input) {\n  // Write your solution here\n}`,
  python: `def solve(input):\n    # Write your solution here\n    pass`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
};

// NOTE: This page only creates CODING challenges — that's the only
// question type backed by the `challenges` table (title, test cases,
// starter code, Run/Submit). Multiple Choice, True/False and Short
// Answer questions live on an EXAM instead (see the `exam_questions`
// table), so they're created from the "Manage Exams" page, which
// already has a fully working form for all four question types.
export default function AdminChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    difficulty: "easy",
    category: "",
    xpReward: 100,
    language: "javascript",
    starterCode: starterCodes.javascript,
  });

  const [testCases, setTestCases] = useState([{ ...emptyTestCase }]);

  useEffect(() => {
    loadChallenges();
  }, []);

  async function loadChallenges() {
    try {
      const data = await api.challenges();
      setChallenges(data);
    } catch (err) {
      setError(err.message);
    }
  }

  function updateTestCase(index, field, value) {
    setTestCases((prev) =>
      prev.map((tc, i) => (i === index ? { ...tc, [field]: value } : tc))
    );
  }

  function addTestCase() {
    setTestCases((prev) => [...prev, { ...emptyTestCase }]);
  }

  function removeTestCase(index) {
    setTestCases((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.createChallenge({
        title: form.title,
        description: form.description,
        difficulty: form.difficulty,
        category: form.category,
        xpReward: Number(form.xpReward) || 100,
        languages: [
          {
            language: form.language,
            starterCode: form.starterCode,
          },
        ],
        testCases: testCases
          .filter((tc) => tc.expectedOutput.trim() !== "")
          .map((tc) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden,
          })),
      });

      setMessage("Coding challenge created successfully.");
      resetForm();
      loadChallenges();
    } catch (err) {
      setError(err.message);
    }
  }

  function resetForm() {
    setForm({
      title: "",
      description: "",
      difficulty: "easy",
      category: "",
      xpReward: 100,
      language: "javascript",
      starterCode: starterCodes.javascript,
    });
    setTestCases([{ ...emptyTestCase }]);
  }

  async function deleteChallenge(id) {
    try {
      await api.deleteChallenge(id);
      loadChallenges();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--color-ink)] mb-2">MANAGE CODING CHALLENGES</h1>

      <p className="text-sm text-[var(--color-ink-muted)] mb-8">
        Need Multiple Choice, True/False, or Short Answer questions instead?
        Those are created on the{" "}
        <Link to="/admin/exams" className="text-[var(--color-brass-dark)] underline">
          Manage Exams
        </Link>{" "}
        page, where you can also mix them with coding questions in one exam.
      </p>

      <div className="grid xl:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="xl:col-span-2 ledger-card p-6 space-y-3">
          <h2 className="text-[var(--color-ink)] font-bold mb-2">CREATE CODING CHALLENGE</h2>

          {error && <div className="text-[var(--color-red-dark)] text-sm">{error}</div>}
          {message && <div className="text-[var(--color-teal-dark)] text-sm">{message}</div>}

          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input"
            required
          />

          <textarea
            placeholder="Description (explain what the student should solve)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input min-h-24"
            required
          />

          <div className="grid grid-cols-3 gap-3">
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              className="input"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <input
              placeholder="Category (e.g. Loops, Basics)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input"
            />

            <input
              type="number"
              placeholder="XP reward"
              value={form.xpReward}
              onChange={(e) => setForm({ ...form, xpReward: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--color-ink-muted)] font-mono mb-2">
              PROGRAMMING LANGUAGE
            </label>
            <select
              value={form.language}
              onChange={(e) => {
                const language = e.target.value;
                setForm({
                  ...form,
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
            placeholder="Starter code"
            value={form.starterCode}
            onChange={(e) => setForm({ ...form, starterCode: e.target.value })}
            className="input min-h-32 font-mono text-sm"
            required
          />

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs text-[var(--color-ink-muted)] font-mono">TEST CASES</h3>
              <button type="button" onClick={addTestCase} className="text-xs text-[var(--color-brass-dark)] hover:underline">
                + ADD TEST CASE
              </button>
            </div>

            {testCases.map((tc, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
                <input
                  placeholder="input"
                  value={tc.input}
                  onChange={(e) => updateTestCase(i, "input", e.target.value)}
                  className="input col-span-4"
                />
                <input
                  placeholder="expected output"
                  value={tc.expectedOutput}
                  onChange={(e) => updateTestCase(i, "expectedOutput", e.target.value)}
                  className="input col-span-4"
                />
                <label className="col-span-3 text-xs text-[var(--color-ink-muted)] flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tc.isHidden}
                    onChange={(e) => updateTestCase(i, "isHidden", e.target.checked)}
                  />
                  hidden
                </label>
                <button
                  type="button"
                  onClick={() => removeTestCase(i)}
                  className="col-span-1 text-[var(--color-red-dark)] text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 bg-[var(--color-brass)] text-[var(--color-vellum)] font-bold py-3 hover:bg-[var(--color-brass-dark)] transition-colors">
            CREATE CHALLENGE
          </button>
        </form>

        {/* EXISTING CHALLENGES LIST */}
        <div className="ledger-card overflow-x-auto h-fit">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-line)]">
              <tr className="text-left text-[var(--color-ink-muted)] font-mono text-xs">
                <th className="p-4">TITLE</th>
                <th className="p-4">DIFF</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((c) => (
                <tr key={c.id} className="border-b border-[var(--color-line)]">
                  <td className="p-4 text-[var(--color-ink)]">{c.title}</td>
                  <td className="p-4 text-[var(--color-ink-muted)]">{c.difficulty}</td>
                  <td className="p-4">
                    <button onClick={() => deleteChallenge(c.id)} className="text-xs text-[var(--color-red-dark)] hover:underline">
                      DELETE
                    </button>
                  </td>
                </tr>
              ))}
              {challenges.length === 0 && (
                <tr><td colSpan={3} className="p-6 text-center text-[var(--color-ink-muted)]">No challenges yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
