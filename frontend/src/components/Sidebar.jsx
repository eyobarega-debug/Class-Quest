import {
  LayoutDashboard,
  Code2,
  User,
  Shield,
  Users,
  Timer,
  ClipboardList,
  ShieldAlert,
  Trophy,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { user } = useAuth();

  const links = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Coding Arena",
      path: "/challenges",
      icon: Code2,
    },
    {
  name: "Leaderboard",
  path: "/leaderboard",
  icon: Trophy,
},
    {
      name: "Exams",
      path: "/exams",
      icon: Timer,
    },
    {
      name: "Profile",
      path: "/profile",
      icon: User,
    },
  ];

  if (user?.role === "admin") {
    links.push(
      {
        name: "Manage Challenges",
        path: "/admin/challenges",
        icon: Code2,
      },
      {
        name: "Admin Dashboard",
        path: "/admin",
        icon: Shield,
      },
      {
        name: "Students",
        path: "/admin/students",
        icon: Users,
      },
      {
        name: "Manage Exams",
        path: "/admin/exams",
        icon: Timer,
      },
      {
        name: "Submissions",
        path: "/admin/submissions",
        icon: ClipboardList,
      },
      {
        name: "Violations",
        path: "/admin/violations",
        icon: ShieldAlert,
      }
    );
  }

  return (
    <aside className="w-64 h-full border-r border-[var(--color-line)] bg-[var(--color-vellum-raised)]">
      <nav className="p-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm transition border-l-[3px] ${
                  isActive
                    ? "bg-[var(--color-brass)]/12 text-[var(--color-brass-dark)] border-[var(--color-brass)] font-semibold"
                    : "text-[var(--color-ink-muted)] border-transparent hover:bg-[var(--color-vellum-deep)]/60 hover:text-[var(--color-ink)]"
                }`
              }
            >
              <Icon size={18} />
              {link.name}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}