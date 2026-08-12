import { LogOut, Terminal } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LevelBadge from "./LevelBadge";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-gray-800 bg-[#090c11]/95 backdrop-blur flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Terminal className="text-cyan-400" size={24} />

        <span className="font-bold tracking-wider text-white">
          CLASS<span className="text-cyan-400">QUEST</span>
        </span>
      </div>

      <div className="flex items-center gap-5">
        {user && (
          <>
            <div className="hidden md:block text-right">
              <div className="text-sm text-white">
                {user.username || user.name}
              </div>

              <div className="text-xs text-gray-500 font-mono">
                {user.rating ?? 1000} RATING
              </div>
            </div>

            <LevelBadge level={user.level || 1} />

            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-400 transition"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}