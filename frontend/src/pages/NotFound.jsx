import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-[var(--color-vellum)]">
      <p className="font-mono text-[var(--color-brass-dark)] text-sm mb-2 tracking-widest">ERROR 404</p>
      <h1 className="font-display font-bold text-2xl mb-2 text-[var(--color-ink)]">Page not found</h1>
      <p className="text-[var(--color-ink-muted)] text-sm mb-6">This quest doesn't exist yet.</p>
      <Link to="/" className="text-sm text-[var(--color-teal)] hover:underline">
        Back home
      </Link>
    </div>
  );
}
