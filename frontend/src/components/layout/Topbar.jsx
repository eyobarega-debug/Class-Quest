import { Bell, Search, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = (user?.name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="flex items-center gap-3 border-b border-border-subtle bg-surface/60 backdrop-blur-sm px-4 md:px-6 py-3">
      <div className="flex-1 flex items-center gap-2 rounded-lg bg-surface-raised border border-border-subtle px-3 py-1.5 max-w-sm">
        <Search size={16} className="text-text-muted" />
        <input
          placeholder="Search challenges, classmates..."
          className="bg-transparent outline-none text-sm placeholder:text-text-muted w-full"
          disabled
          title="Search arrives in a later phase"
        />
      </div>

      <button
        className="relative p-2 rounded-lg hover:bg-surface-raised text-text-muted focus-ring"
        title="Notifications (coming soon)"
      >
        <Bell size={18} />
      </button>

      <div className="flex items-center gap-2 pl-2 border-l border-border-subtle">
        <div className="w-8 h-8 rounded-full bg-surface-raised border border-border-subtle flex items-center justify-center text-xs font-mono font-bold text-xp">
          {initials}
        </div>
        <div className="hidden sm:block leading-none">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-[11px] text-text-muted capitalize">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="ml-1 p-2 rounded-lg hover:bg-surface-raised text-text-muted hover:text-danger focus-ring"
          title="Log out"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
