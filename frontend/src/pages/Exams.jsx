import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .exams()
      .then(setExams)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <p className="text-cyan-400 text-xs font-mono mb-2">TIMED ASSESSMENTS</p>
        <h1 className="text-3xl font-bold text-white">EXAMS</h1>
        <p className="text-gray-500 mt-2">Password-protected, timed exams assigned by your instructor.</p>
      </div>

      {error && <div className="border border-red-500/30 bg-red-500/5 text-red-400 p-4 mb-6">{error}</div>}

      {loading ? (
        <div className="mt-10 text-center text-cyan-400 font-mono animate-pulse">LOADING EXAMS...</div>
      ) : exams.length === 0 ? (
        <div className="mt-10 text-center border border-gray-800 p-10 text-gray-500">
          No exams available right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
          {exams.map((exam) => {
                        const attempt = exam.studentAttempt;
            const isFinished = attempt && attempt.status !== "in_progress";

            // COMPLETED EXAM CARD (DISABLED & UNCLICKABLE)
            if (isFinished) {
              const approved = attempt.resultApproved;

              return (
                <div
                  key={exam.id}
                  className="border border-gray-800/80 bg-[#0a0d12] p-5 opacity-60 cursor-not-allowed select-none flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-white font-bold">{exam.title}</h2>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          approved
                            ? "bg-green-500/10 border-green-500/30 text-green-400"
                            : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                        }`}
                      >
                        {approved ? "RESULT APPROVED" : "PENDING REVIEW"}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{exam.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono pt-3 border-t border-gray-800/60">
                    <span className="text-gray-500">{exam.duration_minutes} min</span>
                    {approved ? (
                      <span className="text-green-400 flex items-center gap-1">
                        ✓ {attempt.totalScore} / {attempt.maxScore}
                      </span>
                    ) : (
                      <span className="text-yellow-400 flex items-center gap-1">
                        ⏳ Awaiting approval
                      </span>
                    )}
                  </div>
                </div>
              );
            }
            // ACTIVE EXAM CARD (CLICKABLE)
            return (
              <Link
                key={exam.id}
                to={`/exams/${exam.id}`}
                className="border border-gray-800 bg-[#0d1117] p-5 hover:border-cyan-400/50 transition-colors block flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-white font-bold mb-2">{exam.title}</h2>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{exam.description}</p>
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-3 border-t border-gray-800/60">
                  <span className="text-cyan-400">{exam.duration_minutes} min</span>
                  <span className="text-gray-500">
                    {exam.has_password || exam.hasPassword ? "🔒 Password required" : "Open"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}