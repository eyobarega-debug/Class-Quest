import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { api } from "../services/api";

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function ExamTake() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(location.state?.attempt || null);
  const [exam, setExam] = useState(location.state?.exam || null);
  const [questions, setQuestions] = useState(location.state?.questions || []);

  const [remainingSeconds, setRemainingSeconds] = useState(location.state?.attempt?.remainingSeconds ?? null);
  const [answers, setAnswers] = useState({}); // questionId -> local answer text
  const [saved, setSaved] = useState({}); // questionId -> true once saved
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(null); // final { totalScore, maxScore } once submitted
  const [loading, setLoading] = useState(!location.state);

  const pollRef = useRef(null);
  const finishingRef = useRef(false);

  // If the page was refreshed (no router state), resume via /start.
  // This never sends a stored password — if one is required and we
  // don't have it, the backend rejects and we send the student back
  // to the password screen, exactly as the spec requires.
  useEffect(() => {
    if (location.state) return;

    api
      .startExam(id, undefined)
      .then((data) => {
        setAttempt(data.attempt);
        setExam(data.exam);
        setQuestions(data.questions);
        setRemainingSeconds(data.attempt.remainingSeconds);
      })
      .catch(() => navigate(`/exams/${id}`, { replace: true }))
      .finally(() => setLoading(false));
  }, [id, location.state, navigate]);

  const finishExam = useCallback(async () => {
    if (finishingRef.current || !attempt) return;
    finishingRef.current = true;
    try {
      const result = await api.finishExam(attempt.id);
      setFinished(result);
    } catch (err) {
      setError(err.message);
    }
  }, [attempt]);

  // Backend is the source of truth: poll every 5s to re-sync the
  // countdown and detect server-side expiry, regardless of what the
  // local tab's clock thinks.
  useEffect(() => {
    if (!attempt || finished) return;

    async function poll() {
      try {
        const status = await api.examAttemptStatus(attempt.id);
        setRemainingSeconds(status.remainingSeconds);
        if (status.status !== "in_progress") {
          finishExam();
        }
      } catch {
        // ignore transient poll failures; local countdown still runs
      }
    }

    poll();
    pollRef.current = setInterval(poll, 5000);
    return () => clearInterval(pollRef.current);
  }, [attempt, finished, finishExam]);

  // Smooth local countdown between polls.
  useEffect(() => {
    if (remainingSeconds === null || finished) return;
    if (remainingSeconds <= 0) {
      finishExam();
      return;
    }
    const t = setTimeout(() => setRemainingSeconds((s) => (s === null ? s : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [remainingSeconds, finished, finishExam]);

  async function saveAnswer(question, value) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    setError("");
    try {
      await api.answerExamQuestion(attempt.id, question.id, value);
      setSaved((prev) => ({ ...prev, [question.id]: true }));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <div className="text-cyan-400 font-mono animate-pulse">LOADING EXAM...</div>;
  }

  if (finished) {
    return (
      <div className="max-w-lg mx-auto mt-10 border border-gray-800 bg-[#0d1117] p-8 text-center">
        <p className="text-cyan-400 text-xs font-mono mb-2">
          {finished.status === "expired" ? "TIME EXPIRED" : "EXAM SUBMITTED"}
        </p>
        <h1 className="text-2xl font-bold text-white mb-4">{exam?.title}</h1>
        <p className="text-gray-400 mb-6">
          {finished.status === "expired"
            ? "Your exam time ran out and was automatically submitted."
            : "Your answers have been submitted."}
        </p>
        <div className="text-3xl font-bold text-cyan-400 mb-6">
          {finished.totalScore} / {finished.maxScore}
        </div>
        <Link to="/exams" className="text-cyan-400 underline text-sm">
          Back to exams
        </Link>
      </div>
    );
  }

  if (!attempt || !exam) {
    return <div className="text-red-400">{error || "Could not load this exam attempt."}</div>;
  }

  const lowTime = remainingSeconds !== null && remainingSeconds <= 60;

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[#07090d] border-b border-gray-800 pb-4 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-cyan-400 text-xs font-mono mb-1">{exam.title}</p>
          <h1 className="text-xl font-bold text-white">Time Remaining: {formatTime(remainingSeconds ?? 0)}</h1>
        </div>
        <div className={`font-mono text-lg px-4 py-2 border ${lowTime ? "border-red-500 text-red-400 animate-pulse" : "border-cyan-400/30 text-cyan-400"}`}>
          {formatTime(remainingSeconds ?? 0)}
        </div>
        <button
          onClick={finishExam}
          className="bg-cyan-400 text-black font-bold px-5 py-2 hover:bg-cyan-300"
        >
          FINISH & SUBMIT
        </button>
      </div>

      {error && <div className="mb-4 border border-red-500/30 bg-red-500/5 text-red-400 p-3 text-sm">{error}</div>}

      <div className="space-y-5">
        {questions.map((q, i) => (
          <div key={q.id} className="border border-gray-800 bg-[#0d1117] p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-500 font-mono">Question {i + 1}</span>
              <span className="text-xs text-cyan-400 font-mono uppercase">{q.type.replace("_", " ")}</span>
              <span className="text-xs text-gray-500 ml-auto">{q.points} pts</span>
            </div>

            {q.type === "coding" ? (
              <div>
                <p className="text-white mb-3">{q.challengeTitle}</p>
                <Link
                  to={`/challenges/${q.challengeSlug}?examAttemptId=${attempt.id}&examId=${id}`}
                  className="inline-block bg-gray-800 text-white text-sm font-mono px-4 py-2 hover:bg-gray-700"
                >
                  OPEN CODE EDITOR →
                </Link>
              </div>
            ) : (
              <>
                <p className="text-white mb-3">{q.question}</p>

                {q.type === "mcq" && (
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={answers[q.id] === opt}
                          onChange={() => saveAnswer(q, opt)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

                {q.type === "true_false" && (
                  <div className="space-y-2">
                    {["true", "false"].map((val) => (
                      <label key={val} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={answers[q.id] === val}
                          onChange={() => saveAnswer(q, val)}
                        />
                        {val === "true" ? "True" : "False"}
                      </label>
                    ))}
                  </div>
                )}

                {q.type === "short_answer" && (
                  <input
                    type="text"
                    className="input"
                    placeholder="Your answer"
                    defaultValue={answers[q.id] || ""}
                    onBlur={(e) => saveAnswer(q, e.target.value)}
                  />
                )}

                {saved[q.id] && <p className="text-xs text-green-400 mt-2">Saved</p>}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}