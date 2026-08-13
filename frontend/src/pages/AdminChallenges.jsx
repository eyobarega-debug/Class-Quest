import { useEffect, useState } from "react";
import { api } from "../services/api";

const emptyTestCase = { input: "", expectedOutput: "", isHidden: false };

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
    starterCode: "",
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

  async function createChallenge(e) {
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
        languages: [{ language: "javascript", starterCode: form.starterCode }],
        testCases: testCases
          .filter((tc) => tc.expectedOutput.trim() !== "")
          .map((tc) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden,
          })),
      });

      setMessage("Challenge created.");
      setForm({ title: "", description: "", difficulty: "easy", category: "", xpReward: 100, starterCode: "" });
      setTestCases([{ ...emptyTestCase }]);
      loadChallenges();
    } catch (err) {
      setError(err.message);
    }
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
      <h1 className="text-3xl font-bold text-white mb-8">MANAGE CHALLENGES</h1>

      <div className="grid xl:grid-cols-3 gap-6">
        <form onSubmit={createChallenge} className="xl:col-span-2 border border-gray-800 bg-[#0d1117] p-6 space-y-3">
          <h2 className="text-white font-bold mb-2">CREATE CHALLENGE (JavaScript)</h2>

          {error && <div className="text-red-400 text-sm">{error}</div>}
          {message && <div className="text-green-400 text-sm">{message}</div>}

          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input"
            required
          />

          <textarea
            placeholder="Description (explain what solve(input) should do)"
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
              placeholder="Category (e.g. Loops)"
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

          <textarea
            placeholder={"Starter code, e.g.\nfunction solve(input) {\n  return input;\n}"}
            value={form.starterCode}
            onChange={(e) => setForm({ ...form, starterCode: e.target.value })}
            className="input min-h-32 font-mono text-sm"
            required
          />

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs text-gray-500 font-mono">TEST CASES</h3>
              <button type="button" onClick={addTestCase} className="text-xs text-cyan-400 hover:underline">
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
                <label className="col-span-3 text-xs text-gray-400 flex items-center gap-2">
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
                  className="col-span-1 text-red-400 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button className="w-full mt-2 bg-cyan-400 text-black font-bold py-3 hover:bg-cyan-300">
            CREATE CHALLENGE
          </button>
        </form>

        <div className="border border-gray-800 bg-[#0d1117] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800">
              <tr className="text-left text-gray-500 font-mono text-xs">
                <th className="p-4">TITLE</th>
                <th className="p-4">DIFF</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((c) => (
                <tr key={c.id} className="border-b border-gray-800">
                  <td className="p-4 text-white">{c.title}</td>
                  <td className="p-4 text-gray-400">{c.difficulty}</td>
                  <td className="p-4">
                    <button onClick={() => deleteChallenge(c.id)} className="text-xs text-red-400 hover:underline">
                      DELETE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}