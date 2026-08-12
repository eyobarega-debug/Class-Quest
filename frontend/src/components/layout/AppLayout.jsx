import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, User, Users } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-void">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileNav role={user?.role} />
    </div>
  );
}

// Section 29 of the brief requires a mobile nav menu. A bottom tab
// bar is the standard pattern for touch navigation, and keeps the
// same core destinations reachable without the desktop sidebar.
function MobileNav({ role }) {
  const links =
    role === 'admin'
      ? [
          { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/admin/students', label: 'Students', icon: Users },
        ]
      : [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/profile', label: 'Profile', icon: User },
        ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-border-subtle bg-surface/95 backdrop-blur-sm flex">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${
              isActive ? 'text-xp' : 'text-text-muted'
            }`
          }
        >
          <Icon size={19} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
