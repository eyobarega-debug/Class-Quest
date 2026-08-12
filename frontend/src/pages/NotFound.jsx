import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-void">
      <p className="font-mono text-xp text-sm mb-2">ERROR 404</p>
      <h1 className="font-display font-bold text-2xl mb-2">Page not found</h1>
      <p className="text-text-muted text-sm mb-6">This quest doesn't exist yet.</p>
      <Link to="/" className="text-sm text-xp hover:underline">
        Back home
      </Link>
    </div>
  );
}
