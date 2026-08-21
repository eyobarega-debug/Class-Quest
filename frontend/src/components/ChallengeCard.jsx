import { Code2, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const difficultyStyles = {
  easy: "text-[var(--color-teal-dark)] border-[var(--color-teal)]/40 bg-[var(--color-teal)]/8",
  medium: "text-[var(--color-brass-dark)] border-[var(--color-brass)]/40 bg-[var(--color-brass)]/8",
  hard: "text-[#a15a1f] border-[#a15a1f]/40 bg-[#a15a1f]/8",
  expert: "text-[var(--color-red-dark)] border-[var(--color-red)]/40 bg-[var(--color-red)]/8",
};

export default function ChallengeCard({ challenge }) {
  const difficulty =
    challenge.difficulty?.toLowerCase() || "easy";

  return (
    <Link
      to={`/challenges/${challenge.slug}`}
      className="group block ticket-card p-5 pt-6 hover:border-[var(--color-brass)]/60 hover:bg-[var(--color-vellum-deep)]/60 transition"
    >
      <div className="flex justify-between items-start gap-3">
        <div>
          <div className="text-xs text-[var(--color-ink-faint)] font-mono mb-2">
            #{challenge.id}
          </div>

          <h3 className="text-lg font-display font-bold text-[var(--color-ink)] group-hover:text-[var(--color-brass-dark)] transition">
            {challenge.title}
          </h3>
        </div>

        <span
          className={`px-2 py-1 text-[10px] uppercase font-mono border ${
            difficultyStyles[difficulty] ||
            difficultyStyles.easy
          }`}
        >
          {difficulty}
        </span>
      </div>

      <p className="mt-3 text-sm text-[var(--color-ink-muted)] line-clamp-2">
        {challenge.description ||
          "Solve this coding challenge and prove your skills."}
      </p>

      <div className="mt-5 flex justify-between items-center">
        <div className="flex gap-3">
          <span className="flex items-center gap-1 text-xs text-[var(--color-ink-muted)]">
            <Code2 size={14} />
            {challenge.category || "General"}
          </span>

          <span className="flex items-center gap-1 text-xs text-[var(--color-brass-dark)] font-medium">
            <Zap size={14} />
            {challenge.xp_reward || challenge.xp || 100} XP
          </span>
        </div>

        <span className="text-xs font-mono text-[var(--color-ink-faint)] group-hover:text-[var(--color-brass-dark)]">
          OPEN →
        </span>
      </div>
    </Link>
  );
}