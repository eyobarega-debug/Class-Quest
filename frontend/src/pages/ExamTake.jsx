import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { api, API_BASE_URL } from "../services/api";

const MONITOR_URL = "http://127.0.0.1:3847";

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
  const [answers, setAnswers] = useState({});
  const [saved, setSaved] = useState({});
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(
    location.state?.attempt?.status && location.state.attempt.status !== "in_progress"
      ? location.state.attempt
      : null
  );
  const [loading, setLoading] = useState(!location.state);
  const [monitorStatus, setMonitorStatus] = useState("checking");

  const pollRef = useRef(null);
  const finishingRef = useRef(false);
  const monitoringStarted = useRef(false);
  const testSessionId = useRef(null);

  // Load exam & verify attempt completion status
  useEffect(() => {
    if (location.state?.attempt) {
      if (location.state.attempt.status !== "in_progress") {
        setFinished(location.state.attempt);
      }
      setLoading(false);
      return;
    }

    api
      .startExam(id, undefined)
      .then((data) => {
        setAttempt(data.attempt);
        setExam(data.exam);
        setQuestions(data.questions || []);
        setRemainingSeconds(data.attempt.remainingSeconds);

        // Lock exam view if attempt is already completed or expired
        if (data.attempt.status && data.attempt.status !== "in_progress") {
          setFinished(data.attempt);
        }
      })
      .catch((err) => {
        // Redirect back if attempt is forbidden or already completed
        setError(err.message || "Failed to load exam.");
        setTimeout(() => navigate("/exams", { replace: true }), 2000);
      })
      .finally(() => setLoading(false));
  }, [id, location.state, navigate]);

  // Check Proctoring Status (Only while active)
  useEffect(() => {
    if (finished) return;
    let cancelled = false;

    async function checkMonitor() {
      try {
        const response = await fetch(`${MONITOR_URL}/status`);
        if (!response.ok) {
          if (!cancelled) setMonitorStatus("offline");
          return;
        }
        const data = await response.json();
        if (cancelled) return;
        setMonitorStatus(data.monitoring ? "monitoring" : "connected");
      } catch {
        if (!cancelled) setMonitorStatus("offline");
      }
    }

    checkMonitor();
    const interval = setInterval(checkMonitor, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [finished]);

  // Start Proctoring Monitoring
  useEffect(() => {
    if (!attempt?.id || !exam?.title || finished) return;
    if (monitorStatus !== "connected" && monitorStatus !== "monitoring") return;
    if (monitoringStarted.current) return;

    async function startMonitoring() {
      try {
        const token = localStorage.getItem("classquest_token");
        if (!token) return;

        const data = await api.startTestSession({ examAttemptId: attempt.id });
        if (!data?.session?.id) throw new Error("Proctoring session was not created.");

        testSessionId.current = data.session.id;

        const monitorResponse = await fetch(`${MONITOR_URL}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: data.session.id,
            examAttemptId: attempt.id,
            token,
            allowedTitle: exam.title || "ClassQuest",
          }),
        });

        if (!monitorResponse.ok) {
          const monitorData = await monitorResponse.json();
          throw new Error(monitorData.message || "Failed to start Electron monitor.");
        }

        monitoringStarted.current = true;
        setMonitorStatus("monitoring");
      } catch (err) {
        console.error("FAILED TO START EXAM MONITORING:", err);
        setMonitorStatus("offline");
      }
    }

    startMonitoring();
  }, [attempt, exam, monitorStatus, finished]);

  // Clean up proctoring on unmount
  useEffect(() => {
    return () => {
      if (monitoringStarted.current) {
        fetch(`${MONITOR_URL}/stop`, { method: "POST" }).catch(() => {});
        monitoringStarted.current = false;
      }
      if (testSessionId.current) {
        api.finishTestSession(testSessionId.current).catch(() => {});
        testSessionId.current = null;
      }
    };
  }, []);

  const stopProctoring = useCallback(async () => {
    if (monitoringStarted.current) {
      fetch(`${MONITOR_URL}/stop`, { method: "POST" }).catch(() => {});
      monitoringStarted.current = false;
    }
    if (testSessionId.current) {
      try {
        await api.finishTestSession(testSessionId.current);
      } catch (err) {
        console.error("FAILED TO CLOSE PROCTORING SESSION:", err);
      }
      testSessionId.current = null;
    }
  }, []);

  const finishExam = useCallback(async () => {
    if (finishingRef.current || !attempt) return;
    finishingRef.current = true;
    try {
      const result = await api.finishExam(attempt.id);
      setFinished(result);
      await stopProctoring();
    } catch (err) {
      setError(err.message);
      finishingRef.current = false;
    }
  }, [attempt, stopProctoring]);

  // Poll status
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
        // ignore transient poll failures
      }
    }

    poll();
    pollRef.current = setInterval(poll, 5000);
    return () => clearInterval(pollRef.current);
  }, [attempt, finished, finishExam]);

  // Countdown timer
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
    if (finished) return;
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

  // EXAM COMPLETED / ATTEMPT LOCKED SCREEN
  if (finished) {
    return (
      <div className="max-w-lg mx-auto mt-10 border border-gray-800 bg-[#0d1117] p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 text-green-400 text-3xl font-bold rounded-full flex items-center justify-center mx-auto">
          ✓
        </div>
        <p className="text-cyan-400 text-xs font-mono uppercase tracking-wider">
          {finished.status === "expired" ? "TIME EXPIRED" : "EXAM SUBMITTED"}
        </p>
        <h1 className="text-2xl font-bold text-white">{exam?.title || "Exam"}</h1>
        <p className="text-gray-400 text-sm">
          You have already completed this exam. Re-taking or editing answers is strictly prohibited.
        </p>
        <p className="text-xs text-gray-500">Your instructor has received your submission.</p>
        <div className="pt-2">
          <Link
            to="/exams"
            className="inline-block bg-cyan-400 text-black font-bold px-6 py-2.5 hover:bg-cyan-300 text-xs font-mono transition"
          >
          </Link>
        </div>
      </div>
    );
  }

  if (!attempt || !exam) {
    return <div className="text-red-400 p-4 border border-red-500/30 bg-red-500/5">{error || "Could not load exam attempt."}</div>;
  }

  const lowTime = remainingSeconds !== null && remainingSeconds <= 60;

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[#07090d] border-b border-gray-800 pb-4 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-cyan-400 text-xs font-mono mb-1">{exam.title}</p>
          <h1 className="text-xl font-bold text-white">Time Remaining: {formatTime(remainingSeconds ?? 0)}</h1>
        </div>
        <div
          className={`font-mono text-lg px-4 py-2 border ${
            lowTime ? "border-red-500 text-red-400 animate-pulse" : "border-cyan-400/30 text-cyan-400"
          }`}
        >
          {formatTime(remainingSeconds ?? 0)}
        </div>
        <span
          title="Proctoring status"
          className={`text-xs font-mono px-2 py-1 border ${
            monitorStatus === "monitoring"
              ? "border-green-500/30 text-green-400"
              : monitorStatus === "connected"
              ? "border-yellow-500/30 text-yellow-400"
              : "border-gray-700 text-gray-500"
          }`}
        >
          MONITOR: {monitorStatus.toUpperCase()}
        </span>
        <button
          onClick={finishExam}
          className="bg-cyan-400 text-black font-bold px-5 py-2 hover:bg-cyan-300 transition"
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
                <p className="text-white mb-3 whitespace-pre-line">{q.question}</p>

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
                    className="input w-full"
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