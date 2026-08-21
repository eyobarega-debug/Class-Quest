import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { Compass, Lock, User, Mail, UserCircle } from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-vellum)] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(169,118,31,0.10),transparent_45%)]" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 border border-[var(--color-brass)]/40 bg-[var(--color-brass)]/8 mb-5">
            <Compass size={30} className="text-[var(--color-brass)]" />
          </div>

          <h1 className="text-3xl font-display font-bold tracking-tight text-[var(--color-ink)]">
            Class<span className="text-[var(--color-brass-dark)]">Quest</span>
          </h1>

          <p className="text-[var(--color-ink-muted)] text-sm mt-2 font-mono tracking-wide">CREATE YOUR ACCOUNT</p>
        </div>

        <form onSubmit={handleSubmit} className="ledger-card p-7">
          <h2 className="text-[var(--color-ink)] font-display font-bold text-lg mb-6">Join the Arena</h2>

          {error && (
            <div className="mb-4 border border-[var(--color-red)]/30 bg-[var(--color-red)]/5 text-[var(--color-red-dark)] p-3 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="text-xs text-[var(--color-ink-muted)] font-mono tracking-wide block mb-2">FULL NAME</label>
            <div className="relative">
              <UserCircle size={18} className="absolute left-3 top-3 text-[var(--color-ink-faint)]" />
              <input
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                className="input pl-10"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs text-[var(--color-ink-muted)] font-mono tracking-wide block mb-2">USERNAME</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-3 text-[var(--color-ink-faint)]" />
              <input
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                className="input pl-10"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs text-[var(--color-ink-muted)] font-mono tracking-wide block mb-2">EMAIL</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3 text-[var(--color-ink-faint)]" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="input pl-10"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="text-xs text-[var(--color-ink-muted)] font-mono tracking-wide block mb-2">PASSWORD</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3 text-[var(--color-ink-faint)]" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="input pl-10"
                required
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Creating account…" : "Create account →"}
          </button>

          <p className="text-center text-[var(--color-ink-faint)] text-xs mt-5 font-mono">
            Already have an account?{" "}
            <Link to="/login" className="text-[var(--color-teal)] hover:underline">
              LOG IN
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
