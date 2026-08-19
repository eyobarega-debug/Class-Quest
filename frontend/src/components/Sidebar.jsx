import {
  LayoutDashboard,
  Code2,
  User,
  Shield,
  Users,
  Timer,
  ClipboardList,
  AlertTriangle,
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
        name: "Manage Challenges",
        path: "/admin/challenges",
        icon: Code2,
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
        icon: AlertTriangle,
      }
    );
  }

  return (
    <aside className="hidden lg:block w-64 border-r border-stone-800 bg-[#0a0806] min-h-[calc(100vh-64px)]">
      <nav className="p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 transition ${
                  isActive
                    ? "bg-[#c9a877]/10 text-[#c9a877] border-l-2 border-[#c9a877]"
                    : "text-stone-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={19} />
              {link.name}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}