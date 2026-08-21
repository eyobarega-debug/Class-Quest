import {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

import {
  useParams,
  useSearchParams,
  Link,
} from "react-router-dom";

import Editor from "@monaco-editor/react";

import {
  api,
  API_BASE_URL,
} from "../services/api";

const languageConfig = {
  javascript: {
    monaco: "javascript",
  },

  js: {
    monaco: "javascript",
  },

  cpp: {
    monaco: "cpp",
  },

  "c++": {
    monaco: "cpp",
  },

  python: {
    monaco: "python",
  },

  java: {
    monaco: "java",
  },
};

const MONITOR_URL =
  "http://127.0.0.1:3847";

export default function ChallengeDetail() {
  const { slug } = useParams();

  const [searchParams] =
    useSearchParams();

  const examAttemptId =
    searchParams.get(
      "examAttemptId"
    );

  // ===============================
  // STATE
  // ===============================

  const [challenge, setChallenge] =
    useState(null);

  const [language, setLanguage] =
    useState("javascript");

  const [code, setCode] =
    useState("");

  const [result, setResult] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [running, setRunning] =
    useState(false);

  const [testSession, setTestSession] =
    useState(null);

  const [monitorStatus, setMonitorStatus] =
    useState("checking");

  const monitoringStarted =
    useRef(false);

  // ===============================
  // LOAD CHALLENGE
  // ===============================

  const loadChallenge =
    useCallback(async () => {
      setLoading(true);

      try {
        const data =
          await api.challenge(
            slug
          );

        const item =
          data.challenge ||
          data;

        setChallenge(item);

        const languages =
          item.languages ||
          item.challenge_languages ||
          [];

        if (
          languages.length > 0
        ) {
          const first =
            languages[0];

          const firstLanguage =
            first.language ||
            first.language_name ||
            "javascript";

          setLanguage(
            firstLanguage
          );

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
        const response =
          await fetch(
            `${MONITOR_URL}/status`
          );

        if (!response.ok) {
          if (!cancelled) {
            setMonitorStatus(
              "offline"
            );
          }

          return;
        }

        const data =
          await response.json();

        if (cancelled) {
          return;
        }

        if (data.monitoring) {
          setMonitorStatus(
            "monitoring"
          );
        } else {
          setMonitorStatus(
            "connected"
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Monitor connection error:",
            error
          );

          setMonitorStatus(
            "offline"
          );
        }
      }
    }

    checkMonitor();

    const interval =
      setInterval(
        checkMonitor,
        3000
      );

    return () => {
      cancelled = true;
      clearInterval(
        interval
      );
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
      monitorStatus !==
        "connected" &&
      monitorStatus !==
        "monitoring"
    ) {
      return;
    }

    if (
      monitoringStarted.current
    ) {
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

        // ===============================
        // CREATE DATABASE SESSION
        // ===============================

        const data =
          await api.startTestSession(
            challenge.id
          );

        console.log(
          "Test session response:",
          data
        );

        if (
          !data?.session?.id
        ) {
          throw new Error(
            "Test session was not created."
          );
        }

        const session =
          data.session;

        setTestSession(
          session
        );

        // ===============================
        // START ELECTRON MONITOR
        // ===============================

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
                sessionId:
                  session.id,

                challengeId:
                  challenge.id,

                examAttemptId:
                  examAttemptId ||
                  undefined,

                token,

                // ⭐ IMPORTANT FIX
                apiBaseUrl:
                  API_BASE_URL,

                allowedTitle:
                  challenge.title ||
                  "ClassQuest",
              }),
            }
          );

        const monitorData =
          await monitorResponse.json();

        if (
          !monitorResponse.ok
        ) {
          throw new Error(
            monitorData.message ||
              "Failed to start Electron monitor."
          );
        }

        monitoringStarted.current =
          true;

        setMonitorStatus(
          "monitoring"
        );

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
          "API:",
          API_BASE_URL
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

        setMonitorStatus(
          "offline"
        );
      }
    }

    startMonitoring();
  }, [
    challenge,
    monitorStatus,
    examAttemptId,
  ]);

  // ===============================
  // STOP MONITOR
  // ===============================

  useEffect(() => {
    return () => {
      if (
        !monitoringStarted.current
      ) {
        return;
      }

      fetch(
        `${MONITOR_URL}/stop`,
        {
          method: "POST",
        }
      ).catch(() => {});

      monitoringStarted.current =
        false;

      console.log(
        "ClassQuest monitor stopped."
      );
    };
  }, []);

  // ===============================
  // LANGUAGE
  // ===============================

  function changeLanguage(
    newLanguage
  ) {
    setLanguage(
      newLanguage
    );

    const languages =
      challenge?.languages ||
      challenge?.challenge_languages ||
      [];

    const selected =
      languages.find(
        (item) =>
          (
            item.language ||
            item.language_name
          ) === newLanguage
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
          slug:
            challenge.slug,

          language,

          source_code:
            code,
        });

      setResult(
        response
      );
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
          slug:
            challenge.slug,

          language,

          source_code:
            code,

          examAttemptId:
            examAttemptId ||
            undefined,
        });

      setResult(
        response
      );
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
    changeLanguage(
      language
    );
  }

  // ===============================
  // LOADING
  // ===============================

  if (loading) {
    return (
      <div className="text-[var(--color-brass-dark)] font-mono animate-pulse">
        LOADING CHALLENGE...
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="text-[var(--color-red)]">
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
        <div className="mb-4 border border-[var(--color-teal)]/30 bg-[var(--color-teal)]/5 text-[var(--color-teal-dark)] text-sm p-3 flex items-center justify-between">
          <span>
            Answering this coding
            question as part of
            your exam.
          </span>

          <Link
            to={`/exams/${
              searchParams.get(
                "examId"
              ) || ""
            }/take`}
            className="underline"
          >
            ← Back to exam
          </Link>
        </div>
      )}

      {/* HEADER */}

      <div className="mb-5">

        <div className="flex flex-wrap items-center gap-3 mb-3">

          <span className="text-xs border border-[var(--color-teal)]/40 text-[var(--color-teal-dark)] px-2 py-1 font-mono uppercase">
            {challenge.difficulty}
          </span>

          <span className="text-xs text-[var(--color-ink-muted)] font-mono">
            {challenge.category}
          </span>

          <span className="text-xs text-[var(--color-brass-dark)] font-mono font-medium">
            +
            {challenge.xp_reward ||
              challenge.xp ||
              100}
            XP
          </span>

          {/* MONITOR */}

          <span
            className={`text-xs px-2 py-1 font-mono ${
              monitorStatus ===
              "monitoring"
                ? "text-[var(--color-teal-dark)] border border-[var(--color-teal)]/40"
                : monitorStatus ===
                  "connected"
                ? "text-[var(--color-brass-dark)] border border-[var(--color-brass)]/40"
                : monitorStatus ===
                  "offline"
                ? "text-[var(--color-red-dark)] border border-[var(--color-red)]/40"
                : "text-[var(--color-brass-dark)] border border-[var(--color-brass)]/40"
            }`}
          >
            MONITOR:{" "}
            {monitorStatus.toUpperCase()}
          </span>

        </div>

        <h1 className="text-3xl font-display font-bold text-[var(--color-ink)]">
          {challenge.title}
        </h1>

      </div>

      {/* MAIN */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* PROBLEM */}

        <section className="ledger-card">

          <div className="p-5 border-b border-[var(--color-line)]">

            <h2 className="font-display font-bold text-[var(--color-ink)] mb-4">
              Problem
            </h2>

            <div className="text-sm text-[var(--color-ink-muted)] whitespace-pre-wrap leading-7">
              {challenge.description}
            </div>

          </div>

          {challenge.constraints && (
            <div className="p-5 border-b border-[var(--color-line)]">

              <h3 className="text-xs text-[var(--color-ink-muted)] font-mono tracking-wide mb-3">
                CONSTRAINTS
              </h3>

              <div className="text-sm text-[var(--color-ink-muted)] whitespace-pre-wrap">
                {challenge.constraints}
              </div>

            </div>
          )}

        </section>

        {/* CODE EDITOR */}

        <section className="border border-[var(--color-line)] bg-[#1c1712] overflow-hidden">

          <div className="flex items-center justify-between border-b border-[var(--color-line)]/30 px-4 py-3">

            <div className="flex gap-2">

              {languages.map(
                (item) => {
                  const lang =
                    item.language ||
                    item.language_name;

                  return (
                    <button
                      key={lang}
                      onClick={() =>
                        changeLanguage(
                          lang
                        )
                      }
                      className={`px-3 py-1.5 text-xs font-mono ${
                        language ===
                        lang
                          ? "bg-[var(--color-brass)] text-[#1c1712] font-semibold"
                          : "bg-[#241e19] text-[#a99872] hover:text-[#f1e9dc]"
                      }`}
                    >
                      {lang}
                    </button>
                  );
                }
              )}

            </div>

            <button
              onClick={
                resetCode
              }
              className="text-xs text-[#93876f] hover:text-[#f1e9dc]"
            >
              RESET
            </button>

          </div>

          <Editor
            height="500px"
            language={
              languageConfig[
                language
              ]?.monaco ||
              language
            }
            value={code}
            onChange={(value) =>
              setCode(
                value || ""
              )
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

          <div className="border-t border-[var(--color-line)]/30 p-3 flex gap-3">

            <button
              onClick={
                runCode
              }
              disabled={running}
              className="px-5 py-2 bg-[#241e19] border border-[#3a3025] text-[#f1e9dc] hover:border-[var(--color-brass)] disabled:opacity-50"
            >
              {running
                ? "RUNNING..."
                : "▶ RUN"}
            </button>

            <button
              onClick={
                submitCode
              }
              disabled={running}
              className="px-5 py-2 bg-[var(--color-brass)] text-[#1c1712] font-bold hover:bg-[var(--color-brass-dark)] disabled:opacity-50"
            >
              {running
                ? "SUBMITTING..."
                : "✓ SUBMIT"}
            </button>

          </div>

        </section>

      </div>

      {/* RESULT */}

      <section className="mt-5 ledger-card">

        <div className="px-5 py-3 border-b border-[var(--color-line)]">

          <h2 className="text-xs text-[var(--color-ink-muted)] font-mono tracking-wide">
            EXECUTION RESULT
          </h2>

        </div>

        <div className="p-5">

          {!result ? (
            <p className="text-[var(--color-ink-faint)] font-mono text-sm">
              Run your code to see
              the result.
            </p>
          ) : result.type ===
            "error" ? (
            <p className="text-[var(--color-red)] font-mono text-sm">
              {result.message}
            </p>
          ) : (
            <div>

              <div className="flex items-center gap-4 mb-4">

                <span
                  className={`text-sm font-mono font-bold px-3 py-1 border ${
                    result.status ===
                    "accepted"
                      ? "text-[var(--color-teal-dark)] border-[var(--color-teal)]/30 bg-[var(--color-teal)]/5"
                      : result.status
                      ? "text-[var(--color-red-dark)] border-[var(--color-red)]/30 bg-[var(--color-red)]/5"
                      : result.passedCount ===
                          result.totalCount &&
                        result.totalCount >
                          0
                      ? "text-[var(--color-teal-dark)] border-[var(--color-teal)]/30 bg-[var(--color-teal)]/5"
                      : "text-[var(--color-brass-dark)] border-[var(--color-brass)]/30 bg-[var(--color-brass)]/5"
                  }`}
                >
                  {result.status
                    ? result.status
                        .replace(
                          /_/g,
                          " "
                        )
                        .toUpperCase()
                    : "RAN"}
                </span>

                <span className="text-sm text-[var(--color-ink-muted)] font-mono">
                  {result.passedCount}/
                  {result.totalCount}{" "}
                  test cases
                  passed
                </span>

                {result.xpEarned >
                  0 && (
                  <span className="text-sm text-[var(--color-brass-dark)] font-mono">
                    +
                    {
                      result.xpEarned
                    }{" "}
                    XP
                  </span>
                )}

              </div>

              <div className="space-y-2">

                {(result.results ||
                  []
                ).map(
                  (r, i) => (
                    <div
                      key={i}
                      className={`border p-3 text-sm ${
                        r.passed
                          ? "border-[var(--color-teal)]/20 bg-[var(--color-teal)]/5"
                          : "border-[var(--color-red)]/20 bg-[var(--color-red)]/5"
                      }`}
                    >

                      <div className="flex items-center justify-between">

                        <span
                          className={`font-mono font-bold ${
                            r.passed
                              ? "text-[var(--color-teal-dark)]"
                              : "text-[var(--color-red-dark)]"
                          }`}
                        >
                          {r.passed
                            ? "✓ PASSED"
                            : "✗ FAILED"}{" "}
                          — Test{" "}
                          {i + 1}
                        </span>

                        <span className="text-xs text-[var(--color-ink-muted)] font-mono">
                          {r.status.replace(
                            /_/g,
                            " "
                          )}

                          {r.executionTimeMs !=
                          null
                            ? ` · ${r.executionTimeMs}ms`
                            : ""}
                        </span>

                      </div>

                      {r.expected !==
                        undefined && (
                        <div className="mt-2 grid grid-cols-2 gap-3 font-mono text-xs">

                          <div>
                            <p className="text-[var(--color-ink-muted)] mb-1">
                              Expected
                            </p>

                            <pre className="text-[var(--color-ink)] whitespace-pre-wrap break-all">
                              {r.expected}
                            </pre>
                          </div>

                          <div>
                            <p className="text-[var(--color-ink-muted)] mb-1">
                              Your output
                            </p>

                            <pre className="text-[var(--color-ink)] whitespace-pre-wrap break-all">
                              {r.actual}
                            </pre>
                          </div>

                        </div>
                      )}

                      {r.message && (
                        <pre className="mt-2 text-xs text-[var(--color-red-dark)] whitespace-pre-wrap break-all">
                          {r.message}
                        </pre>
                      )}

                    </div>
                  )
                )}

              </div>

            </div>
          )}

        </div>

      </section>

    </div>
  );
}