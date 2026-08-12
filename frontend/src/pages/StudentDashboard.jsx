import { Zap, Trophy, Target, Flame, Swords, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import XPBar from '../components/ui/XPBar';
import LevelBadge from '../components/ui/LevelBadge';
import StatCard from '../components/ui/StatCard';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function StudentDashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Welcome + level hero card */}
      <section className="rounded-2xl border border-border-subtle bg-surface p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-5">
        <LevelBadge level={user.level} size={64} />
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-xl">
            {greeting()}, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-text-muted text-sm mt-0.5">Ready for your next challenge?</p>
          <div className="mt-3 max-w-md">
            <XPBar
              percent={user.xpPercent}
              xpIntoLevel={user.xpIntoLevel}
              xpForNextLevel={user.xpForNextLevel}
            />
          </div>
        </div>
      </section>

      {/* Player stats grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Sparkles} label="Level" value={user.level} accent="xp" />
        <StatCard icon={Zap} label="Total XP" value={user.xp.toLocaleString()} accent="xp" />
        <StatCard icon={Trophy} label="Rating" value={user.rating} accent="rating" sublabel="Bronze" />
        <StatCard icon={Flame} label="Streak" value={`${user.streak}d`} accent="warn" />
      </section>

      {/* Today's challenge - placeholder until Phase 2 (challenge DB) exists */}
      <section className="rounded-2xl border border-border-subtle bg-surface p-6">
        <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wide font-medium mb-3">
          <Target size={14} /> Today's Challenge
        </div>
        <div className="rounded-xl border border-dashed border-border-subtle bg-surface-raised/40 p-6 text-center">
          <Swords className="mx-auto mb-2 text-text-muted" size={22} />
          <p className="text-sm text-text-muted">
            The Coding Arena unlocks in Phase 2, once challenges and the code editor are built.
          </p>
        </div>
      </section>

      {/* Recent activity - placeholder until submissions exist (Phase 3-4) */}
      <section className="rounded-2xl border border-border-subtle bg-surface p-6">
        <h2 className="font-display font-semibold text-sm mb-3">Recent Activity</h2>
        <p className="text-sm text-text-muted">
          Nothing yet — your solved challenges, achievements, and battle results will show up
          here once submissions are wired up.
        </p>
      </section>
    </div>
  );
}
