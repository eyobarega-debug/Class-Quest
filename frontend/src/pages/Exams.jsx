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

      {error && <div className="border border-red-500/30 bg-red-500/5 text-red-400 p-4">{error}</div>}

      {loading ? (
        <div className="mt-10 text-center text-cyan-400 font-mono animate-pulse">LOADING EXAMS...</div>
      ) : exams.length === 0 ? (
        <div className="mt-10 text-center border border-gray-800 p-10 text-gray-500">
          No exams available right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
          {exams.map((exam) => (
            <Link
              key={exam.id}
              to={`/exams/${exam.id}`}
              className="border border-gray-800 bg-[#0d1117] p-5 hover:border-cyan-400/50 transition-colors block"
            >
              <h2 className="text-white font-bold mb-2">{exam.title}</h2>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">{exam.description}</p>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-cyan-400">{exam.duration_minutes} min</span>
                <span className="text-gray-500">{exam.has_password ? "🔒 Password required" : "Open"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}