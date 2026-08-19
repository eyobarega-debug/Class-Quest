import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { api } from "../services/api";

const severityColors = {
  low: "text-stone-300 border-stone-500/30",
  medium: "text-[#fbbf24] border-[#fbbf24]/30",
  high: "text-orange-400 border-orange-400/30",
  critical: "text-red-400 border-red-400/30",
};

const severityRank = { low: 0, medium: 1, high: 2, critical: 3 };

export default function AdminViolations() {
  const [violations, setViolations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({}); // username -> bool

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setViolations(await api.violations());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggle(username) {
    setExpanded((prev) => ({ ...prev, [username]: !prev[username] }));
  }

  const groups = violations.reduce((acc, v) => {
    const username = v.username || "Unknown";
    if (!acc[username]) acc[username] = [];
    acc[username].push(v);
    return acc;
  }, {});

  const orderedUsernames = Object.keys(groups).sort((a, b) => {
    const aLatest = new Date(groups[a][0]?.created_at || 0).getTime();
    const bLatest = new Date(groups[b][0]?.created_at || 0).getTime();
    return bLatest - aLatest;
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">TEST VIOLATIONS</h1>
      <p className="text-sm text-stone-400 mb-8">
        Suspicious activity flagged by the desktop monitor during coding challenge sessions —
        window switches, unauthorized apps, and other integrity events.
      </p>

      {error && (
        <div className="mb-4 border border-red-500/30 bg-red-500/5 text-red-400 p-3 text-sm">
          {error}
        </div>
      )}

      <div className="border border-stone-800 bg-[#14110d] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-800">
            <tr className="text-left text-stone-400 font-mono text-xs">
              <th className="p-4">STUDENT</th>
              <th className="p-4">CHALLENGE</th>
              <th className="p-4">EVENT</th>
              <th className="p-4">SEVERITY</th>
              <th className="p-4">APP / WINDOW</th>
              <th className="p-4">WHEN</th>
            </tr>
          </thead>
          <tbody>
            {orderedUsernames.map((username) => {
              const studentViolations = groups[username];
              const isOpen = !!expanded[username];
              const worstSeverity = studentViolations.reduce(
                (worst, v) =>
                  (severityRank[v.severity] ?? 0) > (severityRank[worst] ?? 0) ? v.severity : worst,
                studentViolations[0]?.severity || "low"
              );
              const latest = studentViolations[0];

              return (
                <>
                  <tr
                    key={username}
                    onClick={() => toggle(username)}
                    className="border-b border-stone-800 align-top cursor-pointer hover:bg-stone-900/40"
                  >
                    <td className="p-4 text-white">
                      <div className="flex items-center gap-2">
                        {isOpen ? (
                          <ChevronDown size={14} className="text-stone-500 shrink-0" />
                        ) : (
                          <ChevronRight size={14} className="text-stone-500 shrink-0" />
                        )}
                        <span className="font-semibold">{username}</span>
                        <span className="text-xs font-mono text-stone-500">
                          ({studentViolations.length})
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-stone-300">{latest?.challenge_title}</td>
                    <td className="p-4 text-stone-200 font-mono text-xs uppercase">
                      {latest?.event_type.replace(/_/g, " ")}
                      {studentViolations.length > 1 && (
                        <span className="text-stone-500 normal-case ml-1">+ more</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs font-mono px-2 py-1 border ${
                          severityColors[worstSeverity] || "text-stone-300 border-stone-500/30"
                        }`}
                      >
                        {worstSeverity.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-stone-300 text-xs">
                      {latest?.application_name || "—"}
                      {latest?.window_title && (
                        <div className="text-stone-500 mt-1">{latest.window_title}</div>
                      )}
                    </td>
                    <td className="p-4 text-stone-400 text-xs font-mono">
                      {latest?.created_at && new Date(latest.created_at).toLocaleString()}
                    </td>
                  </tr>

                  {isOpen &&
                    studentViolations.map((v) => (
                      <tr key={v.id} className="border-b border-stone-800 align-top bg-stone-950/40">
                        <td className="p-4 pl-10 text-stone-500 text-xs font-mono">↳</td>
                        <td className="p-4 text-stone-300">{v.challenge_title}</td>
                        <td className="p-4 text-stone-200 font-mono text-xs uppercase">
                          {v.event_type.replace(/_/g, " ")}
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-xs font-mono px-2 py-1 border ${
                              severityColors[v.severity] || "text-stone-300 border-stone-500/30"
                            }`}
                          >
                            {v.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-stone-300 text-xs">
                          {v.application_name || "—"}
                          {v.window_title && <div className="text-stone-500 mt-1">{v.window_title}</div>}
                        </td>
                        <td className="p-4 text-stone-400 text-xs font-mono">
                          {new Date(v.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </>
              );
            })}
            {!loading && violations.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-stone-400">
                  No violations recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}