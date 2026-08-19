import {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import Editor from "@monaco-editor/react";

import { api } from "../services/api";

const languageConfig = {
  javascript: { monaco: "javascript" },
  js: { monaco: "javascript" },
  cpp: { monaco: "cpp" },
  "c++": { monaco: "cpp" },
  python: { monaco: "python" },
  java: { monaco: "java" },
};

const MONITOR_URL = "http://127.0.0.1:3847";

export default function ChallengeDetail() {
   const { slug } = useParams();

  // Optional: present only when this coding question is being
  // answered as part of a timed exam (linked from ExamTake.jsx).
  // Does not affect the page at all when absent.
  const [searchParams] = useSearchParams();
  const examAttemptId = searchParams.get("examAttemptId");

  // ===============================
  // STATE
  // ===============================
  const [challenge, setChallenge] = useState(null);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const [testSession, setTestSession] = useState(null);
  const [monitorStatus, setMonitorStatus] =
    useState("checking");

  const monitoringStarted = useRef(false);

  // ===============================
  // LOAD CHALLENGE
  // ===============================

  const loadChallenge = useCallback(async () => {
    setLoading(true);

    try {
      const data = await api.challenge(slug);

      const item = data.challenge || data;

      setChallenge(item);

      const languages =
        item.languages ||
        item.challenge_languages ||
        [];

      if (languages.length > 0) {
        const first = languages[0];

        const firstLanguage =
          first.language ||
          first.language_name ||
          "javascript";

        setLanguage(firstLanguage);

        setCode(
          first.starter_code ||
            first.code ||
            ""
        );
      }
    } catch (err) {
      console.error(
        "Failed to load challenge:",
        err
      );

      setResult({
        type: "error",
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  // ===============================
  // CHECK ELECTRON MONITOR
  // ===============================

  useEffect(() => {
    let cancelled = false;

    async function checkMonitor() {
      try {
        const response = await fetch(
          `${MONITOR_URL}/status`
        );

        if (!response.ok) {
          if (!cancelled) {
            setMonitorStatus("offline");
          }

          return;
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (data.monitoring) {
          setMonitorStatus("monitoring");
        } else {
          setMonitorStatus("connected");
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Monitor connection error:",
            error
          );

          setMonitorStatus("offline");
        }
      }
    }

    checkMonitor();

    const interval = setInterval(
      checkMonitor,
      3000
    );

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // ===============================
  // START MONITORING
  // ===============================

  useEffect(() => {
    if (!challenge?.id) {
      return;
    }

    if (
      monitorStatus !== "connected" &&
      monitorStatus !== "monitoring"
    ) {
      return;
    }

    if (monitoringStarted.current) {
      return;
    }

    async function startMonitoring() {
      try {
        const token =
          localStorage.getItem(
            "classquest_token"
          );

        if (!token) {
          console.error(
            "No ClassQuest authentication token found."
          );

          return;
        }

        // --------------------------------
        // Create / get database session
        // --------------------------------

        const data =
          await api.startTestSession(
            challenge.id
          );

        console.log(
          "Test session response:",
          data
        );

        if (!data?.session?.id) {
          throw new Error(
            "Test session was not created."
          );
        }

        const session = data.session;

        setTestSession(session);

        // --------------------------------
        // Start Electron monitor
        // --------------------------------

        const monitorResponse =
          await fetch(
            `${MONITOR_URL}/start`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                sessionId: session.id,

                challengeId: challenge.id,

                token,

                // The monitor uses this
                // to identify the ClassQuest page.
                allowedTitle:
                  challenge.title ||
                  "ClassQuest",
              }),
            }
          );

        const monitorData =
          await monitorResponse.json();

        if (!monitorResponse.ok) {
          throw new Error(
            monitorData.message ||
              "Failed to start Electron monitor."
          );
        }

        monitoringStarted.current = true;

        setMonitorStatus("monitoring");

        console.log(
          "================================"
        );

        console.log(
          "CLASSQUEST MONITORING STARTED"
        );

        console.log(
          "Session:",
          session.id
        );

        console.log(
          "Challenge:",
          challenge.id
        );

        console.log(
          "Allowed title:",
          challenge.title
        );

        console.log(
          "Monitor:",
          monitorData.message
        );

        console.log(
          "================================"
        );
      } catch (error) {
        console.error(
          "FAILED TO START MONITORING:",
          error
        );

        setMonitorStatus("offline");
      }
    }

    startMonitoring();
  }, [challenge, monitorStatus]);

  // ===============================
  // STOP MONITOR
  // ===============================

  useEffect(() => {
    return () => {
      if (!monitoringStarted.current) {
        return;
      }

      fetch(`${MONITOR_URL}/stop`, {
        method: "POST",
      }).catch(() => {});

      monitoringStarted.current = false;

      console.log(
        "ClassQuest monitor stopped."
      );
    };
  }, []);

  // ===============================
  // LANGUAGE
  // ===============================

  function changeLanguage(newLanguage) {
    setLanguage(newLanguage);

    const languages =
      challenge?.languages ||
      challenge?.challenge_languages ||
      [];

    const selected = languages.find(
      (item) =>
        (item.language ||
          item.language_name) ===
        newLanguage
    );

    if (selected) {
      setCode(
        selected.starter_code ||
          selected.code ||
          ""
      );
    }
  }

  // ===============================
  // RUN CODE
  // ===============================

  async function runCode() {
    setRunning(true);

    try {
      const response =
        await api.runCode({
          slug: challenge.slug,
          language,
          source_code: code,
        });

      setResult(response);
    } catch (err) {
      setResult({
        type: "error",
        message: err.message,
      });
    } finally {
      setRunning(false);
    }
  }

  // ===============================
  // SUBMIT CODE
  // ===============================

  async function submitCode() {
    setRunning(true);

    try {
      const response =
        await api.submitCode({
          slug: challenge.slug,
          language,
          source_code: code,
          examAttemptId: examAttemptId || undefined,

        });

      setResult(response);
    } catch (err) {
      setResult({
        type: "error",
        message: err.message,
      });
    } finally {
      setRunning(false);
    }
  }

  // ===============================
  // RESET
  // ===============================

  function resetCode() {
    changeLanguage(language);
  }

  // ===============================
  // LOADING
  // ===============================

  if (loading) {
    return (
      <div className="text-cyan-400 font-mono animate-pulse">
        LOADING CHALLENGE...
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="text-red-400">
        Challenge not found.
      </div>
    );
  }

  const languages =
    challenge.languages ||
    challenge.challenge_languages ||
    [];

  // ===============================
  // UI
  // ===============================

  return (
    <div>

      {examAttemptId && (
        <div className="mb-4 border border-cyan-400/30 bg-cyan-400/5 text-cyan-400 text-sm p-3 flex items-center justify-between">
          <span>Answering this coding question as part of your exam.</span>
          <Link to={`/exams/${searchParams.get("examId") || ""}/take`} className="underline">
            ← Back to exam
          </Link>
        </div>
      )}


      {/* ===============================
          HEADER
      =============================== */}

      <div className="mb-5">

        <div className="flex flex-wrap items-center gap-3 mb-3">

          <span className="text-xs border border-green-400/30 text-green-400 px-2 py-1">
            {challenge.difficulty}
          </span>

          <span className="text-xs text-gray-500 font-mono">
            {challenge.category}
          </span>

          <span className="text-xs text-cyan-400 font-mono">
            +{challenge.xp_reward ||
              challenge.xp ||
              100} XP
          </span>

          {/* MONITOR STATUS */}

          <span
            className={`text-xs px-2 py-1 font-mono ${
              monitorStatus === "monitoring"
                ? "text-green-400 border border-green-400/30"
                : monitorStatus === "connected"
                ? "text-yellow-400 border border-yellow-400/30"
                : monitorStatus === "offline"
                ? "text-red-400 border border-red-400/30"
                : "text-yellow-400 border border-yellow-400/30"
            }`}
          >
            MONITOR:{" "}
            {monitorStatus.toUpperCase()}
          </span>

        </div>

        <h1 className="text-3xl font-bold text-white">
          {challenge.title}
        </h1>

      </div>

      {/* ===============================
          MAIN CONTENT
      =============================== */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* ===============================
            PROBLEM
        =============================== */}

        <section className="border border-gray-800 bg-[#0d1117]">

          <div className="p-5 border-b border-gray-800">

            <h2 className="font-bold text-white mb-4">
              PROBLEM
            </h2>

            <div className="text-sm text-gray-400 whitespace-pre-wrap leading-7">
              {challenge.description}
            </div>

          </div>

          {challenge.constraints && (
            <div className="p-5 border-b border-gray-800">

              <h3 className="text-xs text-gray-500 font-mono mb-3">
                CONSTRAINTS
              </h3>

              <div className="text-sm text-gray-400 whitespace-pre-wrap">
                {challenge.constraints}
              </div>

            </div>
          )}

        </section>

        {/* ===============================
            CODE EDITOR
        =============================== */}

        <section className="border border-gray-800 bg-[#0b0e13] overflow-hidden">

          <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">

            <div className="flex gap-2">

              {languages.map((item) => {

                const lang =
                  item.language ||
                  item.language_name;

                return (
                  <button
                    key={lang}
                    onClick={() =>
                      changeLanguage(lang)
                    }
                    className={`px-3 py-1.5 text-xs font-mono ${
                      language === lang
                        ? "bg-cyan-400 text-black"
                        : "bg-[#151a22] text-gray-400 hover:text-white"
                    }`}
                  >
                    {lang}
                  </button>
                );

              })}

            </div>

            <button
              onClick={resetCode}
              className="text-xs text-gray-500 hover:text-white"
            >
              RESET
            </button>

          </div>

          <Editor
            height="500px"

            language={
              languageConfig[language]
                ?.monaco || language
            }

            value={code}

            onChange={(value) =>
              setCode(value || "")
            }

            theme="vs-dark"

            options={{
              minimap: {
                enabled: false,
              },

              fontSize: 14,

              fontFamily:
                "JetBrains Mono, monospace",

              padding: {
                top: 15,
              },

              automaticLayout: true,
            }}
          />

          <div className="border-t border-gray-800 p-3 flex gap-3">

            <button
              onClick={runCode}
              disabled={running}
              className="px-5 py-2 bg-[#151a22] border border-gray-700 text-white hover:border-cyan-400 disabled:opacity-50"
            >
              {running
                ? "RUNNING..."
                : "▶ RUN"}
            </button>

            <button
              onClick={submitCode}
              disabled={running}
              className="px-5 py-2 bg-cyan-400 text-black font-bold hover:bg-cyan-300 disabled:opacity-50"
            >
              {running
                ? "SUBMITTING..."
                : "✓ SUBMIT"}
            </button>

          </div>

        </section>

      </div>

      {/* ===============================
          EXECUTION RESULT
      =============================== */}

      <section className="mt-5 border border-gray-800 bg-[#0d1117]">

        <div className="px-5 py-3 border-b border-gray-800">

          <h2 className="text-xs text-gray-500 font-mono">
            EXECUTION RESULT
          </h2>

        </div>

        <div className="p-5">

                   {!result ? (
            <p className="text-gray-600 font-mono text-sm">
              Run your code to see the result.
            </p>
          ) : result.type === "error" ? (
            <p className="text-red-400 font-mono text-sm">
              {result.message}
            </p>
          ) : (
            <div>
              {/* Overall status */}
              <div className="flex items-center gap-4 mb-4">
                <span
                  className={`text-sm font-mono font-bold px-3 py-1 border ${
                    result.status === "accepted"
                      ? "text-green-400 border-green-400/30 bg-green-400/5"
                      : result.status
                      ? "text-red-400 border-red-400/30 bg-red-400/5"
                      : result.passedCount === result.totalCount && result.totalCount > 0
                      ? "text-green-400 border-green-400/30 bg-green-400/5"
                      : "text-yellow-400 border-yellow-400/30 bg-yellow-400/5"
                  }`}
                >
                  {result.status
                    ? result.status.replace(/_/g, " ").toUpperCase()
                    : "RAN"}
                </span>

                <span className="text-sm text-gray-400 font-mono">
                  {result.passedCount}/{result.totalCount} test cases passed
                </span>

                {result.xpEarned > 0 && (
                  <span className="text-sm text-cyan-400 font-mono">
                    +{result.xpEarned} XP
                  </span>
                )}
              </div>

              {/* Per-test-case breakdown */}
              <div className="space-y-2">
                {(result.results || []).map((r, i) => (
                  <div
                    key={i}
                    className={`border p-3 text-sm ${
                      r.passed
                        ? "border-green-400/20 bg-green-400/5"
                        : "border-red-400/20 bg-red-400/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-mono font-bold ${r.passed ? "text-green-400" : "text-red-400"}`}>
                        {r.passed ? "✓ PASSED" : "✗ FAILED"} — Test {i + 1}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {r.status.replace(/_/g, " ")}
                        {r.executionTimeMs != null ? ` · ${r.executionTimeMs}ms` : ""}
                      </span>
                    </div>

                    {r.expected !== undefined && (
                      <div className="mt-2 grid grid-cols-2 gap-3 font-mono text-xs">
                        <div>
                          <p className="text-gray-500 mb-1">Expected</p>
                          <pre className="text-gray-300 whitespace-pre-wrap break-all">{r.expected}</pre>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Your output</p>
                          <pre className="text-gray-300 whitespace-pre-wrap break-all">{r.actual}</pre>
                        </div>
                      </div>
                    )}

                    {r.message && (
                      <pre className="mt-2 text-xs text-red-300 whitespace-pre-wrap break-all">{r.message}</pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </section>

    </div>
  );
}