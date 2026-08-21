import { Flame, Trophy, Target, Calendar } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import XPBar from "../components/XPBar";
import LevelBadge from "../components/LevelBadge";

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  const xp = user.xp || 0;
  const level = user.level || 1;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <section className="ledger-card p-6 flex flex-col sm:flex-row sm:items-center gap-5">
        <LevelBadge level={level} />

        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-xl text-[var(--color-ink)]">
            {user.name || user.username}
          </h1>
          <p className="text-[var(--color-ink-muted)] text-sm font-mono">@{user.username}</p>
          <div className="mt-3 max-w-sm">
            <XPBar xp={xp} level={level} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Trophy} label="RATING" value={user.rating || 1000} />
        <StatCard icon={Flame} label="STREAK" value={`${user.streak || 0} DAYS`} />
        <StatCard icon={Target} label="SOLVED" value={user.solved_count || 0} />
        <StatCard
          icon={Calendar}
          label="JOINED"
          value={
            user.createdAt || user.created_at
              ? new Date(user.createdAt || user.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  year: "numeric",
                })
              : "—"
          }
        />
      </section>

      <section className="ledger-card p-6">
        <h2 className="font-display font-semibold text-[var(--color-ink)] mb-2">Language Breakdown</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Per-language solve counts will appear here once you've submitted a few challenges.
        </p>
      </section>

      <section className="ledger-card p-6">
        <h2 className="font-display font-semibold text-[var(--color-ink)] mb-2">Achievements</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">No achievements unlocked yet.</p>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="ledger-card p-5">
      <Icon size={20} className="text-[var(--color-brass)] mb-4" />
      <div className="text-xs text-[var(--color-ink-muted)] font-mono tracking-wide">{label}</div>
      <div className="text-xl font-display font-bold text-[var(--color-ink)] mt-1">{value}</div>
    </div>
  );
}
