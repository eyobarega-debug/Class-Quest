import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
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

export default function ChallengeDetail() {
  const { slug } = useParams();

  const [challenge, setChallenge] = useState(null);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const loadChallenge = useCallback(async () => {
    setLoading(true);

    try {
      const data = await api.challenge(slug);
      const item = data.challenge || data;

      setChallenge(item);

      const languages = item.languages || item.challenge_languages || [];

      if (languages.length > 0) {
        const first = languages[0];

        setLanguage(first.language || first.language_name || "javascript");
        setCode(first.starter_code || first.code || "");
      }
    } catch (err) {
      setResult({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  function changeLanguage(newLanguage) {
    setLanguage(newLanguage);

    const languages = challenge?.languages || challenge?.challenge_languages || [];

    const selected = languages.find(
      (item) => (item.language || item.language_name) === newLanguage
    );

    if (selected) {
      setCode(selected.starter_code || selected.code || "");
    }
  }

  async function runCode() {
    setRunning(true);

    try {
      const response = await api.runCode({
        slug: challenge.slug,
        language,
        source_code: code,
      });

      setResult(response);
    } catch (err) {
      setResult({ type: "error", message: err.message });
    } finally {
      setRunning(false);
    }
  }

  async function submitCode() {
    setRunning(true);

    try {
      const response = await api.submitCode({
        slug: challenge.slug,
        language,
        source_code: code,
      });

      setResult(response);
    } catch (err) {
      setResult({ type: "error", message: err.message });
    } finally {
      setRunning(false);
    }
  }

  function resetCode() {
    changeLanguage(language);
  }

  if (loading) {
    return (
      <div className="text-cyan-400 font-mono animate-pulse">
        LOADING CHALLENGE...
      </div>
    );
  }

  if (!challenge) {
    return <div className="text-red-400">Challenge not found.</div>;
  }

  const languages = challenge.languages || challenge.challenge_languages || [];

  return (
    <div>
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="text-xs border border-green-400/30 text-green-400 px-2 py-1">
            {challenge.difficulty}
          </span>

          <span className="text-xs text-gray-500 font-mono">
            {challenge.category}
          </span>

          <span className="text-xs text-cyan-400 font-mono">
            +{challenge.xp_reward || challenge.xp || 100} XP
          </span>
        </div>

        <h1 className="text-3xl font-bold text-white">{challenge.title}</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="border border-gray-800 bg-[#0d1117]">
          <div className="p-5 border-b border-gray-800">
            <h2 className="font-bold text-white mb-4">PROBLEM</h2>

            <div className="text-sm text-gray-400 whitespace-pre-wrap leading-7">
              {challenge.description}
            </div>
          </div>

          {challenge.constraints && (
            <div className="p-5 border-b border-gray-800">
              <h3 className="text-xs text-gray-500 font-mono mb-3">CONSTRAINTS</h3>
              <div className="text-sm text-gray-400 whitespace-pre-wrap">
                {challenge.constraints}
              </div>
            </div>
          )}
        </section>

        <section className="border border-gray-800 bg-[#0b0e13] overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
            <div className="flex gap-2">
              {languages.map((item) => {
                const lang = item.language || item.language_name;

                return (
                  <button
                    key={lang}
                    onClick={() => changeLanguage(lang)}
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

            <button onClick={resetCode} className="text-xs text-gray-500 hover:text-white">
              RESET
            </button>
          </div>

          <Editor
            height="500px"
            language={languageConfig[language]?.monaco || language}
            value={code}
            onChange={(value) => setCode(value || "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "JetBrains Mono, monospace",
              padding: { top: 15 },
              automaticLayout: true,
            }}
          />

          <div className="border-t border-gray-800 p-3 flex gap-3">
            <button
              onClick={runCode}
              disabled={running}
              className="px-5 py-2 bg-[#151a22] border border-gray-700 text-white hover:border-cyan-400 disabled:opacity-50"
            >
              {running ? "RUNNING..." : "▶ RUN"}
            </button>

            <button
              onClick={submitCode}
              disabled={running}
              className="px-5 py-2 bg-cyan-400 text-black font-bold hover:bg-cyan-300 disabled:opacity-50"
            >
              ✓ SUBMIT
            </button>
          </div>
        </section>
      </div>

      <section className="mt-5 border border-gray-800 bg-[#0d1117]">
        <div className="px-5 py-3 border-b border-gray-800">
          <h2 className="text-xs text-gray-500 font-mono">EXECUTION RESULT</h2>
        </div>

        <div className="p-5">
          {!result ? (
            <p className="text-gray-600 font-mono text-sm">
              Run your code to see the result.
            </p>
          ) : (
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </section>
    </div>
  );
}