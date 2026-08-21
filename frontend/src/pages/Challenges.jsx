import { useEffect, useState } from "react";

import { api } from "../services/api";
import ChallengeCard from "../components/ChallengeCard";
import ChallengeFilters from "../components/ChallengeFilters";

export default function Challenges() {
  const [challenges, setChallenges] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    language: "",
    difficulty: "",
    category: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadChallenges();
  }, [filters]);

  async function loadChallenges() {
    setLoading(true);
    setError("");

    try {
      const data = await api.challenges(filters);

      setChallenges(
        Array.isArray(data)
          ? data
          : data.challenges || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-[var(--color-brass-dark)] text-xs font-mono tracking-widest mb-2">
          SELECT YOUR MISSION
        </p>

        <h1 className="text-3xl font-display font-bold text-[var(--color-ink)]">
          Coding Arena
        </h1>

        <p className="text-[var(--color-ink-muted)] mt-2">
          Solve challenges. Build skill. Earn XP.
        </p>
      </div>

      <ChallengeFilters
        filters={filters}
        setFilters={setFilters}
      />

      {error && (
        <div className="mt-6 border border-[var(--color-red)]/30 bg-[var(--color-red)]/5 text-[var(--color-red-dark)] p-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-10 text-center text-[var(--color-brass-dark)] font-mono animate-pulse">
          LOADING CHALLENGES...
        </div>
      ) : challenges.length === 0 ? (
        <div className="mt-10 text-center ledger-card p-10 text-[var(--color-ink-muted)]">
          No challenges found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-8">
          {challenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
            />
          ))}
        </div>
      )}
    </div>
  );
}
