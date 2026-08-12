import { Code2, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const difficultyStyles = {
  easy: "text-green-400 border-green-400/30 bg-green-400/5",
  medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",
  hard: "text-orange-400 border-orange-400/30 bg-orange-400/5",
  expert: "text-red-400 border-red-400/30 bg-red-400/5",
};

export default function ChallengeCard({ challenge }) {
  const difficulty =
    challenge.difficulty?.toLowerCase() || "easy";

  return (
    <Link
      to={`/challenges/${challenge.slug}`}
      className="group block border border-gray-800 bg-[#0d1117] p-5 hover:border-cyan-400/50 hover:bg-[#111820] transition"
    >
      <div className="flex justify-between items-start gap-3">
        <div>
          <div className="text-xs text-gray-500 font-mono mb-2">
            #{challenge.id}
          </div>

          <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition">
            {challenge.title}
          </h3>
        </div>

        <span
          className={`px-2 py-1 text-[10px] uppercase border ${
            difficultyStyles[difficulty] ||
            difficultyStyles.easy
          }`}
        >
          {difficulty}
        </span>
      </div>

      <p className="mt-3 text-sm text-gray-400 line-clamp-2">
        {challenge.description ||
          "Solve this coding challenge and prove your skills."}
      </p>

      <div className="mt-5 flex justify-between items-center">
        <div className="flex gap-3">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Code2 size={14} />
            {challenge.category || "General"}
          </span>

          <span className="flex items-center gap-1 text-xs text-cyan-400">
            <Zap size={14} />
            {challenge.xp_reward || challenge.xp || 100} XP
          </span>
        </div>

        <span className="text-xs font-mono text-gray-600 group-hover:text-cyan-400">
          OPEN →
        </span>
      </div>
    </Link>
  );
}