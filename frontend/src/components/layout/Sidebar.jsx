import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Swords, Trophy, User, Shield, Users, Lock, Timer, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// "soon: true" items are part of ClassQuest's full design
const studentLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/arena', label: 'Coding Arena', icon: Swords, soon: true },
  { to: '/exams', label: 'Exams', icon: Timer },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy, soon: true },
  { to: '/profile', label: 'Profile', icon: User },
];

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/challenges', label: 'Challenges', icon: Swords, soon: true },
  { to: '/admin/exams', label: 'Exams', icon: Timer },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed md:static
          inset-y-0 left-0
          z-50
          w-60
          shrink-0
          flex flex-col
          border-r border-border-subtle
          bg-surface/95 md:bg-surface/60
          backdrop-blur-sm
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="px-5 py-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 shrink-0"
              style={{
                clipPath:
                  'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                background:
                  'linear-gradient(135deg, var(--color-xp), var(--color-rating))',
              }}
            />

            <div className="leading-none">
              <p className="font-display font-bold text-lg tracking-tight">
                ClassQuest
              </p>

              <p className="text-[10px] text-text-muted tracking-widest">
                CODE · COMPETE · LEVEL UP
              </p>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {links.map(({ to, label, icon: Icon, soon }) => (
            <SidebarLink
              key={to}
              to={to}
              label={label}
              Icon={Icon}
              soon={soon}
              onClick={onClose}
            />
          ))}
        </nav>

        {/* Admin badge */}
        {user?.role === 'admin' && (
          <div className="mx-3 mb-4 rounded-lg bg-surface-raised border border-border-subtle px-3 py-2 flex items-center gap-2 text-xs text-text-muted">
            <Shield size={14} className="text-rating" />
            Signed in as admin
          </div>
        )}
      </aside>
    </>
  );
}

function SidebarLink({ to, label, Icon, soon, onClick }) {
  if (soon) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-text-muted/60 cursor-not-allowed select-none">
        <span className="flex items-center gap-2.5 text-sm">
          <Icon size={17} />
          {label}
        </span>

        <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide">
          <Lock size={10} />
          Soon
        </span>
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors focus-ring ${
          isActive
            ? 'bg-surface-raised text-xp border border-border-subtle'
            : 'text-text-muted hover:text-text-primary hover:bg-surface-raised/60'
        }`
      }
    >
      <Icon size={17} />
      {label}
    </NavLink>
  );
}