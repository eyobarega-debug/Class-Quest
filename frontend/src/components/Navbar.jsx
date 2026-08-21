import { LogOut, Compass, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import LevelBadge from "./LevelBadge";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-[var(--color-line)] bg-[var(--color-vellum-raised)]/95 backdrop-blur flex items-center justify-between px-4 md:px-6 shadow-sm">

        {/* Left side */}
        <div className="flex items-center gap-3">

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg text-[var(--color-ink-muted)] hover:bg-[var(--color-vellum)] hover:text-[var(--color-ink)] transition"
            title="Open menu"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Compass
              className="text-[var(--color-brass)]"
              size={24}
              strokeWidth={2}
            />

            <span className="font-display font-bold tracking-wide text-[var(--color-ink)] text-lg">
              Class<span className="text-[var(--color-brass)]">Quest</span>
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 md:gap-5">
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

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">

          {/* Dark overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />

          {/* Menu drawer */}
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[var(--color-vellum-raised)] shadow-xl border-r border-[var(--color-line)]">

            {/* Menu header */}
            <div className="h-16 px-5 border-b border-[var(--color-line)] flex items-center justify-between">

              <div className="flex items-center gap-2.5">
                <Compass
                  className="text-[var(--color-brass)]"
                  size={24}
                />

                <span className="font-display font-bold tracking-wide text-[var(--color-ink)] text-lg">
                  Class<span className="text-[var(--color-brass)]">
                    Quest
                  </span>
                </span>
              </div>

              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg text-[var(--color-ink-muted)] hover:bg-[var(--color-vellum)] hover:text-[var(--color-ink)] transition"
                title="Close menu"
              >
                <X size={21} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-2">

              <MobileLink
                href="/dashboard"
                label="Dashboard"
                onClick={() => setMenuOpen(false)}
              />

              <MobileLink
                href="/challenges"
                label="Challenges"
                onClick={() => setMenuOpen(false)}
              />

              <MobileLink
                href="/exams"
                label="Exams"
                onClick={() => setMenuOpen(false)}
              />

              <MobileLink
                href="/profile"
                label="Profile"
                onClick={() => setMenuOpen(false)}
              />

              {user?.role === "admin" && (
                <>
                  <div className="pt-5 pb-2 px-3 text-xs font-mono tracking-wider text-[var(--color-ink-muted)] uppercase">
                    Admin
                  </div>

                  <MobileLink
                    href="/admin"
                    label="Admin Dashboard"
                    onClick={() => setMenuOpen(false)}
                  />

                  <MobileLink
                    href="/admin/students"
                    label="Students"
                    onClick={() => setMenuOpen(false)}
                  />

                  <MobileLink
                    href="/admin/challenges"
                    label="Challenges"
                    onClick={() => setMenuOpen(false)}
                  />

                  <MobileLink
                    href="/admin/exams"
                    label="Exams"
                    onClick={() => setMenuOpen(false)}
                  />
                </>
              )}

            </nav>
          </aside>
        </div>
      )}
    </>
  );
}

function MobileLink({ href, label, onClick }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="block px-4 py-3 rounded-lg text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-vellum)] transition"
    >
      {label}
    </a>
  );
}