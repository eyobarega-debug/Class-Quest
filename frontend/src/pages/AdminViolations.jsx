import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { api } from "../services/api";

const severityColors = {
  low: "text-stone-300 border-stone-500/30",
  medium: "text-[#fbbf24] border-[#fbbf24]/30",
  high: "text-orange-400 border-orange-400/30",
  critical: "text-red-400 border-red-400/30",
};

const severityRank = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export default function AdminViolations() {
  const [violations, setViolations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState({});

  async function load(showLoading = false) {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const data = await api.violations({
        limit: 100,
        offset: 0,
      });

      setViolations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load violations:", err);

      setError(
        err.message || "Failed to load violations"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Initial load + automatic refresh every 5 seconds
  useEffect(() => {
    load(true);

    const interval = setInterval(() => {
      load(false);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  function toggle(username) {
    setExpanded((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
  }

  const groups = violations.reduce((acc, violation) => {
    const username =
      violation.username || "Unknown";

    if (!acc[username]) {
      acc[username] = [];
    }

    acc[username].push(violation);

    return acc;
  }, {});

  const orderedUsernames = Object.keys(groups).sort(
    (a, b) => {
      const aLatest = Math.max(
        ...groups[a].map((v) =>
          new Date(v.created_at || 0).getTime()
        )
      );

      const bLatest = Math.max(
        ...groups[b].map((v) =>
          new Date(v.created_at || 0).getTime()
        )
      );

      return bLatest - aLatest;
    }
  );

  return (
    <div>
      {/* =============================== */}
      {/* HEADER */}
      {/* =============================== */}

      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-white">
            TEST VIOLATIONS
          </h1>

          <p className="text-sm text-stone-400 mt-2 mb-8">
            Suspicious activity flagged by the desktop
            monitor during coding challenge sessions —
            window switches, unauthorized apps, and
            other integrity events.
          </p>
        </div>

        <button
          onClick={() => load(false)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 border border-stone-700 text-stone-300 hover:text-white hover:border-stone-500 text-xs font-mono disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          REFRESH
        </button>
      </div>

      {/* =============================== */}
      {/* ERROR */}
      {/* =============================== */}

      {error && (
        <div className="mb-4 border border-red-500/30 bg-red-500/5 text-red-400 p-3 text-sm">
          {error}
        </div>
      )}

      {/* =============================== */}
      {/* LIVE STATUS */}
      {/* =============================== */}

      <div className="mb-4 flex items-center gap-2 text-xs font-mono text-stone-500">
        <span
          className={`w-2 h-2 rounded-full ${
            refreshing
              ? "bg-yellow-400"
              : "bg-green-400"
          }`}
        />

        {refreshing
          ? "CHECKING FOR NEW VIOLATIONS..."
          : "LIVE MONITORING · REFRESHING EVERY 5 SECONDS"}
      </div>

      {/* =============================== */}
      {/* TABLE */}
      {/* =============================== */}

      <div className="border border-stone-800 bg-[#14110d] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-800">
            <tr className="text-left text-stone-400 font-mono text-xs">
              <th className="p-4">
                STUDENT
              </th>

              <th className="p-4">
                CHALLENGE
              </th>

              <th className="p-4">
                EVENT
              </th>

              <th className="p-4">
                SEVERITY
              </th>

              <th className="p-4">
                APP / WINDOW
              </th>

              <th className="p-4">
                WHEN
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-10 text-center text-stone-400 font-mono"
                >
                  LOADING VIOLATIONS...
                </td>
              </tr>
            ) : (
              <>
                {orderedUsernames.map(
                  (username) => {
                    const studentViolations =
                      groups[username];

                    const isOpen =
                      !!expanded[username];

                    const worstSeverity =
                      studentViolations.reduce(
                        (
                          worst,
                          violation
                        ) => {
                          return (
                            (severityRank[
                              violation
                                .severity
                            ] ?? 0) >
                            (severityRank[
                              worst
                            ] ?? 0)
                              ? violation.severity
                              : worst
                          );
                        },
                        studentViolations[0]
                          ?.severity || "low"
                      );

                    const latest =
                      studentViolations.reduce(
                        (latest, violation) => {
                          if (!latest) {
                            return violation;
                          }

                          return new Date(
                            violation.created_at
                          ) >
                            new Date(
                              latest.created_at
                            )
                            ? violation
                            : latest;
                        },
                        null
                      );

                    return (
                      <tbody key={username}>
                        <tr
                          onClick={() =>
                            toggle(username)
                          }
                          className="border-b border-stone-800 align-top cursor-pointer hover:bg-stone-900/40"
                        >
                          <td className="p-4 text-white">
                            <div className="flex items-center gap-2">
                              {isOpen ? (
                                <ChevronDown
                                  size={14}
                                  className="text-stone-500 shrink-0"
                                />
                              ) : (
                                <ChevronRight
                                  size={14}
                                  className="text-stone-500 shrink-0"
                                />
                              )}

                              <span className="font-semibold">
                                {username}
                              </span>

                              <span className="text-xs font-mono text-stone-500">
                                (
                                {
                                  studentViolations.length
                                }
                                )
                              </span>
                            </div>
                          </td>

                          <td className="p-4 text-stone-300">
                            {latest?.challenge_title ||
                              "—"}
                          </td>

                          <td className="p-4 text-stone-200 font-mono text-xs uppercase">
                            {latest?.event_type
                              ? latest.event_type.replace(
                                  /_/g,
                                  " "
                                )
                              : "—"}

                            {studentViolations.length >
                              1 && (
                              <span className="text-stone-500 normal-case ml-1">
                                + more
                              </span>
                            )}
                          </td>

                          <td className="p-4">
                            <span
                              className={`text-xs font-mono px-2 py-1 border ${
                                severityColors[
                                  worstSeverity
                                ] ||
                                "text-stone-300 border-stone-500/30"
                              }`}
                            >
                              {worstSeverity.toUpperCase()}
                            </span>
                          </td>

                          <td className="p-4 text-stone-300 text-xs">
                            {latest?.application_name ||
                              "—"}

                            {latest?.window_title && (
                              <div className="text-stone-500 mt-1">
                                {
                                  latest.window_title
                                }
                              </div>
                            )}
                          </td>

                          <td className="p-4 text-stone-400 text-xs font-mono">
                            {latest?.created_at
                              ? new Date(
                                  latest.created_at
                                ).toLocaleString()
                              : "—"}
                          </td>
                        </tr>

                        {isOpen &&
                          studentViolations.map(
                            (violation) => (
                              <tr
                                key={
                                  violation.id
                                }
                                className="border-b border-stone-800 align-top bg-stone-950/40"
                              >
                                <td className="p-4 pl-10 text-stone-500 text-xs font-mono">
                                  ↳
                                </td>

                                <td className="p-4 text-stone-300">
                                  {violation.challenge_title ||
                                    "—"}
                                </td>

                                <td className="p-4 text-stone-200 font-mono text-xs uppercase">
                                  {violation.event_type
                                    ? violation.event_type.replace(
                                        /_/g,
                                        " "
                                      )
                                    : "—"}
                                </td>

                                <td className="p-4">
                                  <span
                                    className={`text-xs font-mono px-2 py-1 border ${
                                      severityColors[
                                        violation
                                          .severity
                                      ] ||
                                      "text-stone-300 border-stone-500/30"
                                    }`}
                                  >
                                    {(
                                      violation.severity ||
                                      "low"
                                    ).toUpperCase()}
                                  </span>
                                </td>

                                <td className="p-4 text-stone-300 text-xs">
                                  {violation.application_name ||
                                    "—"}

                                  {violation.window_title && (
                                    <div className="text-stone-500 mt-1">
                                      {
                                        violation.window_title
                                      }
                                    </div>
                                  )}
                                </td>

                                <td className="p-4 text-stone-400 text-xs font-mono">
                                  {violation.created_at
                                    ? new Date(
                                        violation.created_at
                                      ).toLocaleString()
                                    : "—"}
                                </td>
                              </tr>
                            )
                          )}
                      </tbody>
                    );
                  }
                )}

                {violations.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-10 text-center text-stone-400 font-mono"
                    >
                      NO VIOLATIONS RECORDED.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}