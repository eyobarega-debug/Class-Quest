import { useEffect, useState } from "react";
import { api } from "../services/api";

const statusColors = {
  accepted: "text-green-400 border-green-400/30",
  wrong_answer: "text-red-400 border-red-400/30",
  runtime_error: "text-orange-400 border-orange-400/30",
  time_limit_exceeded: "text-yellow-400 border-yellow-400/30",
  unsupported_language: "text-gray-400 border-gray-500/30",
};

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.adminSubmissions();
      setSubmissions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function openSubmission(id) {
    setError("");
    try {
      const detail = await api.adminSubmissionDetail(id);
      setSelected(detail);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">STUDENT SUBMISSIONS</h1>
      <p className="text-sm text-gray-500 mb-8">
        Every coding challenge a student has submitted — what they wrote, and
        their score out of the challenge's test cases (not XP).
      </p>

      {error && <div className="mb-4 border border-red-500/30 bg-red-500/5 text-red-400 p-3 text-sm">{error}</div>}

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 border border-gray-800 bg-[#0d1117] overflow-x-auto h-fit">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800">
              <tr className="text-left text-gray-500 font-mono text-xs">
                <th className="p-4">STUDENT</th>
                <th className="p-4">CHALLENGE</th>
                <th className="p-4">LANG</th>
                <th className="p-4">SCORE</th>
                <th className="p-4">STATUS</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr
                  key={s.id}
                  className={`border-b border-gray-800 ${selected?.id === s.id ? "bg-cyan-400/5" : ""}`}
                >
                  <td className="p-4 text-white">{s.student.name || s.student.username}</td>
                  <td className="p-4 text-gray-400">{s.challenge.title}</td>
                  <td className="p-4 text-gray-400 font-mono text-xs">{s.language}</td>
                  <td className="p-4 text-cyan-400 font-mono">{s.score}</td>
                  <td className="p-4">
                    <span className={`text-xs font-mono px-2 py-1 border ${statusColors[s.status] || "text-gray-400 border-gray-500/30"}`}>
                      {s.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4">
                    <button onClick={() => openSubmission(s.id)} className="text-xs text-cyan-400 hover:underline">
                      VIEW CODE
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && submissions.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">No submissions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Source code viewer */}
        <div className="border border-gray-800 bg-[#0d1117] p-6 h-fit">
          {!selected ? (
            <p className="text-gray-500 text-sm">Select a submission to view the student's source code.</p>
          ) : (
            <div>
              <div className="mb-4">
                <h2 className="text-white font-bold">{selected.challenge.title}</h2>
                <p className="text-xs text-gray-500 font-mono mt-1">
                  {selected.student.name || selected.student.username} · {selected.language}
                </p>
              </div>

              <div className="flex gap-4 mb-4 text-xs font-mono">
                <span className="text-cyan-400">SCORE: {selected.score}</span>
                <span className={statusColors[selected.status]?.split(" ")[0] || "text-gray-400"}>
                  {selected.status.replace(/_/g, " ").toUpperCase()}
                </span>
              </div>

              <pre className="text-xs text-gray-300 bg-[#07090d] border border-gray-800 p-4 overflow-x-auto whitespace-pre-wrap">
                {selected.sourceCode}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}