import {
  Code2,
  Flame,
  Trophy,
  Target,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import XPBar from "../components/XPBar";
import LevelBadge from "../components/LevelBadge";

export default function Dashboard() {
  const { user } = useAuth();

  const xp = user?.xp || 0;
  const level = user?.level || 1;

  return (
    <div>
      <div className="mb-8">
        <p className="text-[var(--color-brass-dark)] text-xs font-mono tracking-widest mb-2">
          WELCOME BACK, EXPLORER
        </p>

        <h1 className="text-3xl font-display font-bold text-[var(--color-ink)]">
          {user?.username || user?.name || "Student"}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 ledger-card p-6">
          <div className="flex items-center gap-5 mb-7">
            <LevelBadge level={level} />

            <div>
              <p className="text-xs text-[var(--color-ink-muted)] font-mono tracking-wide">
                CURRENT LEVEL
              </p>

              <h2 className="text-2xl font-display font-bold text-[var(--color-ink)]">
                Level {level}
              </h2>
            </div>
          </div>

          <XPBar xp={xp} level={level} />
        </div>

        <div className="ledger-card p-6">
          <p className="text-xs text-[var(--color-ink-muted)] font-mono tracking-wide">
            RATING
          </p>

          <div className="text-4xl font-display font-bold text-[var(--color-brass-dark)] mt-2">
            {user?.rating || 1000}
          </div>

          <div className="text-xs text-[var(--color-ink-faint)] mt-2">
            CODING ARENA RATING
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        <StatCard
          icon={Code2}
          label="SOLVED"
          value={user?.solved_count || 0}
        />

        <StatCard
          icon={Flame}
          label="STREAK"
          value={`${user?.streak || 0} DAYS`}
        />

        <StatCard
          icon={Trophy}
          label="RATING"
          value={user?.rating || 1000}
        />

        <StatCard
          icon={Target}
          label="LEVEL"
          value={level}
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="ledger-card p-5">
      <Icon size={20} className="text-[var(--color-brass)] mb-4" />

      <div className="text-xs text-[var(--color-ink-muted)] font-mono tracking-wide">
        {label}
      </div>

      <div className="text-xl font-display font-bold text-[var(--color-ink)] mt-1">
        {value}
      </div>
    </div>
  );
}
