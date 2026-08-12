import { Flame, Trophy, Target, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import XPBar from '../components/ui/XPBar';
import LevelBadge from '../components/ui/LevelBadge';
import StatCard from '../components/ui/StatCard';

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <section className="rounded-2xl border border-border-subtle bg-surface p-6 flex flex-col sm:flex-row sm:items-center gap-5">
        <LevelBadge level={user.level} size={72} />
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-xl uppercase tracking-tight">{user.name}</h1>
          <p className="text-text-muted text-sm font-mono">@{user.username}</p>
          <div className="mt-3 max-w-sm">
            <XPBar
              percent={user.xpPercent}
              xpIntoLevel={user.xpIntoLevel}
              xpForNextLevel={user.xpForNextLevel}
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Trophy} label="Rating" value={user.rating} accent="rating" />
        <StatCard icon={Flame} label="Streak" value={`${user.streak} days`} accent="warn" />
        <StatCard icon={Target} label="Solved" value="0" sublabel="Arena opens Phase 2" accent="muted" />
        <StatCard
          icon={Calendar}
          label="Joined"
          value={new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
          accent="muted"
        />
      </section>

      <section className="rounded-2xl border border-border-subtle bg-surface p-6">
        <h2 className="font-display font-semibold text-sm mb-3">Language Breakdown</h2>
        <p className="text-sm text-text-muted">
          Per-language solve counts (JavaScript, C++, Python, Java, HTML) will appear here once
          the Coding Arena and submissions exist.
        </p>
      </section>

      <section className="rounded-2xl border border-border-subtle bg-surface p-6">
        <h2 className="font-display font-semibold text-sm mb-3">Achievements</h2>
        <p className="text-sm text-text-muted">No achievements unlocked yet.</p>
      </section>
    </div>
  );
}
