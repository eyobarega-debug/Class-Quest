import { useEffect, useState, Fragment } from "react";
import { api } from "../services/api";

const questionTypeLabels = {
  mcq: "MCQ",
  true_false: "TRUE/FALSE",
  short_answer: "SHORT ANSWER",
};

// The backend returns one row per QUESTION answered. Group those by
// attemptId so the table shows one row per student-per-exam-attempt
// (e.g. "tomas — mid") with the total score, and each individual
// question available underneath when expanded.
function groupAnswersByAttempt(answers) {
  const groups = new Map();

  for (const a of answers) {
    if (!groups.has(a.attemptId)) {
      groups.set(a.attemptId, {
        attemptId: a.attemptId,
        student: a.student,
        exam: a.exam,
        attemptStatus: a.attemptStatus,
        questions: [],
        pointsAwarded: 0,
        pointsPossible: 0,
        correctCount: 0,
        latestAnsweredAt: a.answeredAt,
      });
    }

    const group = groups.get(a.attemptId);
    group.questions.push(a);

    const [earned, possible] = a.score.split("/").map(Number);
    group.pointsAwarded += earned || 0;
    group.pointsPossible += possible || 0;
    if (a.isCorrect) group.correctCount += 1;

    if (new Date(a.answeredAt) > new Date(group.latestAnsweredAt)) {
      group.latestAnsweredAt = a.answeredAt;
    }
  }

  // Newest attempt activity first; keep each attempt's own questions
  // in the order they were answered.
  return Array.from(groups.values())
    .map((g) => ({
      ...g,
      questions: g.questions.sort((x, y) => new Date(x.answeredAt) - new Date(y.answeredAt)),
    }))
    .sort((x, y) => new Date(y.latestAnsweredAt) - new Date(x.latestAnsweredAt));
}

export default function AdminSubmissions() {
  const [tab, setTab] = useState("coding"); // "coding" | "exam"

  const [submissions, setSubmissions] = useState([]);
  const [answers, setAnswers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [expandedAttempt, setExpandedAttempt] = useState(null);

  useEffect(() => {
    load();
  }, [tab]);

  async function load() {
    setLoading(true);
    setError("");

    try {
      if (tab === "coding") {
        setSubmissions(await api.adminSubmissions());
      } else {
        setAnswers(await api.examAnswers());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">STUDENT SUBMISSIONS</h1>
      <p className="text-sm text-stone-400 mb-6">
        Everything a student has submitted — coding challenges (with their source code) and
        exam answers (MCQ / True-False / Short Answer) — scored out of the question, not XP.
      </p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("coding")}
          className={`px-4 py-2 text-xs font-mono border ${
            tab === "coding"
              ? "bg-[#c9a877] text-black border-[#c9a877]"
              : "border-stone-800 text-stone-300 hover:text-white"
          }`}
        >
          CODING CHALLENGES
        </button>
        <button
          onClick={() => setTab("exam")}
          className={`px-4 py-2 text-xs font-mono border ${
            tab === "exam"
              ? "bg-[#c9a877] text-black border-[#c9a877]"
              : "border-stone-800 text-stone-300 hover:text-white"
          }`}
        >
          EXAM ANSWERS
        </button>
      </div>

      {error && (
        <div className="mb-4 border border-red-500/30 bg-red-500/5 text-red-400 p-3 text-sm">
          {error}
        </div>
      )}

      {tab === "coding" ? (
        <div className="border border-stone-800 bg-[#14110d] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-800">
              <tr className="text-left text-stone-400 font-mono text-xs">
                <th className="p-4">STUDENT</th>
                <th className="p-4">CHALLENGE</th>
                <th className="p-4">LANG</th>
                <th className="p-4">SCORE</th>
                <th className="p-4">STATUS</th>
                <th className="p-4">WHEN</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <Fragment key={s.id}>
                  <tr className="border-b border-stone-800 align-top">
                    <td className="p-4 text-white">{s.student.name || s.student.username}</td>
                    <td className="p-4 text-stone-300">{s.challenge.title}</td>
                    <td className="p-4 text-stone-400 font-mono text-xs uppercase">{s.language}</td>
                    <td className="p-4 text-[#c9a877] font-mono">{s.score}</td>
                    <td className="p-4">
                      <span
                        className={`text-xs font-mono px-2 py-1 border ${
                          s.status === "accepted"
                            ? "text-green-400 border-green-400/30"
                            : "text-red-400 border-red-400/30"
                        }`}
                      >
                        {s.status.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-stone-400 text-xs font-mono">
                      {new Date(s.submittedAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setExpandedSubmission(expandedSubmission === s.id ? null : s.id)}
                        className="text-xs text-[#c9a877] hover:underline"
                      >
                        {expandedSubmission === s.id ? "HIDE CODE" : "VIEW CODE"}
                      </button>
                    </td>
                  </tr>
                  {expandedSubmission === s.id && (
                    <tr className="border-b border-stone-800">
                      <td colSpan={7} className="p-4 bg-[#0a0806]">
                        <pre className="text-xs text-stone-200 whitespace-pre-wrap font-mono">
                          {s.sourceCode}
                        </pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {!loading && submissions.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-stone-400">
                    No coding submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-stone-800 bg-[#14110d] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-800">
              <tr className="text-left text-stone-400 font-mono text-xs">
                <th className="p-4">STUDENT</th>
                <th className="p-4">EXAM</th>
                <th className="p-4">QUESTIONS</th>
                <th className="p-4">SCORE</th>
                <th className="p-4">RESULT</th>
                <th className="p-4">WHEN</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {groupAnswersByAttempt(answers).map((g) => {
                const allCorrect = g.correctCount === g.questions.length;

                return (
                  <Fragment key={g.attemptId}>
                    <tr className="border-b border-stone-800 align-top">
                      <td className="p-4 text-white">{g.student.name || g.student.username}</td>
                      <td className="p-4 text-stone-300">{g.exam.title}</td>
                      <td className="p-4 text-stone-400 font-mono text-xs">
                        {g.correctCount}/{g.questions.length} correct
                      </td>
                      <td className="p-4 text-[#c9a877] font-mono">
                        {g.pointsAwarded}/{g.pointsPossible}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs font-mono px-2 py-1 border ${
                            allCorrect
                              ? "text-green-400 border-green-400/30"
                              : "text-red-400 border-red-400/30"
                          }`}
                        >
                          {allCorrect ? "ALL CORRECT" : `${g.questions.length - g.correctCount} WRONG`}
                        </span>
                      </td>
                      <td className="p-4 text-stone-400 text-xs font-mono">
                        {new Date(g.latestAnsweredAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setExpandedAttempt(expandedAttempt === g.attemptId ? null : g.attemptId)}
                          className="text-xs text-[#c9a877] hover:underline"
                        >
                          {expandedAttempt === g.attemptId ? "HIDE" : "VIEW ANSWERS"}
                        </button>
                      </td>
                    </tr>
                    {expandedAttempt === g.attemptId && (
                      <tr className="border-b border-stone-800">
                        <td colSpan={7} className="p-0 bg-[#0a0806]">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-stone-500 font-mono border-b border-stone-800">
                                <th className="p-3 pl-8">TYPE</th>
                                <th className="p-3">QUESTION</th>
                                <th className="p-3">STUDENT ANSWERED</th>
                                <th className="p-3">CORRECT ANSWER</th>
                                <th className="p-3">SCORE</th>
                              </tr>
                            </thead>
                            <tbody>
                              {g.questions.map((q) => (
                                <tr key={q.id} className="border-b border-stone-800/50 align-top">
                                  <td className="p-3 pl-8 text-stone-400 font-mono">
                                    {questionTypeLabels[q.questionType] || q.questionType}
                                  </td>
                                  <td className="p-3 text-stone-200">{q.question}</td>
                                  <td className={q.isCorrect ? "p-3 text-green-400" : "p-3 text-red-400"}>
                                    {q.studentAnswer}
                                  </td>
                                  <td className="p-3 text-[#c9a877]">{q.correctAnswer}</td>
                                  <td className="p-3 text-stone-300 font-mono">{q.score}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {!loading && answers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-stone-400">
                    No exam answers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}