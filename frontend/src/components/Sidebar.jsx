import {
  LayoutDashboard,
  Code2,
  User,
  Shield,
  Users,
  Timer,
  ClipboardList,
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
        name: "Manage Exams",
        path: "/admin/exams",
        icon: Timer,
      },
      {
        name: "Submissions",
        path: "/admin/submissions",
        icon: ClipboardList,
      }
    );
  }

  return (
    <aside className="hidden lg:block w-64 border-r border-gray-800 bg-[#090c11] min-h-[calc(100vh-64px)]">
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
                    ? "bg-cyan-400/10 text-cyan-400 border-l-2 border-cyan-400"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
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