import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function ExamPassword() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  useEffect(() => {
    api
      .exam(id)
      .then((data) => setExam(data.exam))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStart(e) {
    e?.preventDefault();
    setError("");
    setStarting(true);

    try {
      // Password is verified server-side inside startExam itself, so
      // a single call both checks the password and begins the timer.
      const data = await api.startExam(id, exam.has_password ? password : undefined);
      navigate(`/exams/${id}/take`, { state: data, replace: true });
    } catch (err) {
      // The backend enforces one attempt per student per exam and
      // rejects with this specific message once already used.
      if (err.message.includes("already completed this exam")) {
        setAlreadyCompleted(true);
      } else {
        setError(err.message); // e.g. "Incorrect exam password."
      }
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return <div className="text-cyan-400 font-mono animate-pulse">LOADING EXAM...</div>;
  }

  if (!exam) {
    return <div className="text-red-400">{error || "Exam not found."}</div>;
  }

  if (alreadyCompleted) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <div className="border border-gray-800 bg-[#0d1117] p-8 text-center">
          <p className="text-cyan-400 text-xs font-mono mb-2">EXAM</p>
          <h1 className="text-2xl font-bold text-white mb-4">{exam.title}</h1>
          <p className="text-gray-400 mb-2">You've already completed this exam.</p>
          <p className="text-sm text-gray-500">Only one attempt is allowed per exam.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="border border-gray-800 bg-[#0d1117] p-8">
        <p className="text-cyan-400 text-xs font-mono mb-2">EXAM</p>
        <h1 className="text-2xl font-bold text-white mb-2">{exam.title}</h1>
        {exam.description && <p className="text-gray-500 text-sm mb-4">{exam.description}</p>}

        <div className="text-xs font-mono text-gray-400 mb-6">
          Duration: <span className="text-cyan-400">{exam.duration_minutes} minutes</span>
          <br />
          Once you start, the timer cannot be paused.
        </div>

        {error && <div className="mb-4 border border-red-500/30 bg-red-500/5 text-red-400 p-3 text-sm">{error}</div>}

        <form onSubmit={handleStart} className="space-y-3">
          {exam.has_password && (
            <div>
              <label className="block text-xs text-gray-500 font-mono mb-2">EXAM PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Enter exam password"
                required
                autoFocus
              />
            </div>
          )}

          <button
            type="submit"
            disabled={starting}
            className="w-full bg-cyan-400 text-black font-bold py-3 hover:bg-cyan-300 disabled:opacity-50"
          >
            {starting ? "STARTING..." : "START EXAM"}
          </button>
        </form>
      </div>
    </div>
  );
}