import { useEffect, useState } from "react";
import { Trophy, Flame, Code2, Crown } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export default function Leaderboard() {
  const { user } = useAuth();

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .leaderboard()
      .then(setLeaderboard)
      .catch((err) => setError(err.message || "Failed to load leaderboard."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <p className="text-[var(--color-brass-dark)] text-xs font-mono tracking-widest mb-2">
          TOP EXPLORERS
        </p>

        <h1 className="text-3xl font-display font-bold text-[var(--color-ink)]">
          Leaderboard
        </h1>

        <p className="text-[var(--color-ink-muted)] mt-2">
          Ranked by XP earned across the Coding Arena.
        </p>
      </div>

      {error && (
        <div className="ledger-card border border-red-400/40 text-red-700 p-4 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-10 text-center text-[var(--color-brass-dark)] font-mono animate-pulse">
          LOADING LEADERBOARD...
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="mt-10 text-center ledger-card p-10 text-[var(--color-ink-muted)]">
          No rankings yet — be the first to solve a challenge!
        </div>
      ) : (
        <>
          {/* TOP 3 PODIUM */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-6 items-end">
              <PodiumCard entry={leaderboard[1]} place={2} isYou={leaderboard[1]?.id === user?.id} />
              <PodiumCard entry={leaderboard[0]} place={1} isYou={leaderboard[0]?.id === user?.id} />
              <PodiumCard entry={leaderboard[2]} place={3} isYou={leaderboard[2]?.id === user?.id} />
            </div>
          )}

          {/* FULL RANKED LIST */}
          <div className="ledger-card overflow-hidden">
            {leaderboard.map((entry) => {
              const isYou = entry.id === user?.id;

              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 px-5 py-4 border-b border-[var(--color-line)] last:border-b-0 ${
                    isYou ? "bg-[var(--color-brass)]/12" : ""
                  }`}
                >
                  <div
                    className={`w-9 text-center font-display font-bold ${
                      entry.rank <= 3
                        ? "text-[var(--color-brass-dark)]"
                        : "text-[var(--color-ink-faint)]"
                    }`}
                  >
                    {entry.rank}
                  </div>

                  <div className="w-9 h-9 rounded-full bg-[var(--color-vellum-deep)] border border-[var(--color-line)] flex items-center justify-center overflow-hidden shrink-0">
                    {entry.avatarUrl ? (
                      <img
                        src={entry.avatarUrl}
                        alt={entry.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-[var(--color-ink-muted)]">
                        {(entry.name || entry.username || "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--color-ink)] font-semibold truncate">
                        {entry.name || entry.username}
                      </span>
                      {isYou && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-brass)]/20 text-[var(--color-brass-dark)]">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--color-ink-faint)] font-mono">
                      @{entry.username}
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-1 text-[var(--color-ink-muted)] text-sm font-mono w-20 justify-end">
                    <Code2 size={14} />
                    {entry.solved}
                  </div>

                  <div className="hidden sm:flex items-center gap-1 text-[var(--color-ink-muted)] text-sm font-mono w-20 justify-end">
                    <Flame size={14} />
                    {entry.streak || 0}
                  </div>

                  <div className="flex items-center gap-1 text-[var(--color-brass-dark)] font-display font-bold w-24 justify-end">
                    <Trophy size={16} />
                    {entry.xp} XP
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function PodiumCard({ entry, place, isYou }) {
  if (!entry) return <div />;

  const heights = { 1: "py-8", 2: "py-5", 3: "py-5" };
  const crownColor =
    place === 1
      ? "text-[var(--color-brass-dark)]"
      : place === 2
      ? "text-[var(--color-ink-muted)]"
      : "text-[var(--color-ink-faint)]";

  return (
    <div
      className={`ledger-card ${heights[place]} px-4 flex flex-col items-center text-center relative ${
        isYou ? "ring-2 ring-[var(--color-brass)]" : ""
      }`}
    >
      {place === 1 && (
        <Crown size={22} className={`${crownColor} absolute -top-3`} fill="currentColor" />
      )}

      <div className="w-14 h-14 rounded-full bg-[var(--color-vellum-deep)] border border-[var(--color-line)] flex items-center justify-center overflow-hidden mb-3">
        {entry.avatarUrl ? (
          <img src={entry.avatarUrl} alt={entry.username} className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-[var(--color-ink-muted)]">
            {(entry.name || entry.username || "?").charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="text-[var(--color-ink)] font-semibold text-sm truncate max-w-full">
        {entry.name || entry.username}
      </div>

      <div className="text-[var(--color-brass-dark)] font-display font-bold mt-1">
        {entry.xp} XP
      </div>

      <div className={`text-xs font-mono mt-2 ${crownColor}`}>#{place}</div>
    </div>
  );
}