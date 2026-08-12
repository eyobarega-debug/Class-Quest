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
        <p className="text-cyan-400 text-xs font-mono mb-2">
          SELECT YOUR MISSION
        </p>

        <h1 className="text-3xl font-bold text-white">
          CODING ARENA
        </h1>

        <p className="text-gray-500 mt-2">
          Solve challenges. Build skill. Earn XP.
        </p>
      </div>

      <ChallengeFilters
        filters={filters}
        setFilters={setFilters}
      />

      {error && (
        <div className="mt-6 border border-red-500/30 bg-red-500/5 text-red-400 p-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-10 text-center text-cyan-400 font-mono animate-pulse">
          LOADING CHALLENGES...
        </div>
      ) : challenges.length === 0 ? (
        <div className="mt-10 text-center border border-gray-800 p-10 text-gray-500">
          No challenges found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
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