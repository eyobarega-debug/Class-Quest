import { LogOut, Compass } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LevelBadge from "./LevelBadge";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-[var(--color-line)] bg-[var(--color-vellum-raised)]/95 backdrop-blur flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-2.5">
        <Compass className="text-[var(--color-brass)]" size={24} strokeWidth={2} />

        <span className="font-display font-bold tracking-wide text-[var(--color-ink)] text-lg">
          Class<span className="text-[var(--color-brass)]">Quest</span>
        </span>
      </div>

      <div className="flex items-center gap-5">
        {user && (
          <>
            <div className="hidden md:block text-right">
              <div className="text-sm text-[var(--color-ink)] font-medium">
                {user.username || user.name}
              </div>

              <div className="text-xs text-[var(--color-ink-muted)] font-mono">
                {user.rating ?? 1000} RATING
              </div>
            </div>

            <LevelBadge level={user.level || 1} />

            <button
              onClick={logout}
              className="p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-red)] transition"
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