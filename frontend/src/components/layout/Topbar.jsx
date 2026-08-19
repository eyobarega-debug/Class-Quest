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
    <header className="flex items-center gap-3 border-b border-[#1E293B] bg-[#121723]/80 backdrop-blur-md px-4 md:px-6 py-3">
      <div className="flex-1 flex items-center gap-2 rounded-lg bg-[#0E121C] border border-[#1E293B] px-3 py-2 max-w-sm">
        <Search size={16} className="text-[#64748B]" />
        <input
          placeholder="Search challenges, classmates..."
          className="bg-transparent outline-none text-sm text-[#F8FAFC] placeholder:text-[#64748B] w-full"
          disabled
          title="Search arrives in a later phase"
        />
      </div>

      <button
        className="relative p-2 rounded-lg hover:bg-[#1A2030] text-[#94A3B8] hover:text-[#F8FAFC] transition"
        title="Notifications (coming soon)"
      >
        <Bell size={18} />
      </button>

      <div className="flex items-center gap-3 pl-3 border-l border-[#1E293B]">
        <div className="w-8 h-8 rounded-full bg-[#1A2030] border border-[#1E293B] flex items-center justify-center text-xs font-mono font-bold text-[#A855F7]">
          {initials}
        </div>
        <div className="hidden sm:block leading-none">
          <p className="text-sm font-medium text-[#F8FAFC]">{user?.name}</p>
          <p className="text-[11px] text-[#94A3B8] capitalize mt-0.5">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="ml-1 p-2 rounded-lg hover:bg-[#1A2030] text-[#94A3B8] hover:text-[#F87171] transition"
          title="Log out"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}