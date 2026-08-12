import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Terminal, Lock, User } from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, login } = useAuth();

  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const loggedUser = await login(username, password);

      if (loggedUser?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07090d] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08),transparent_45%)]" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 border border-cyan-400/40 bg-cyan-400/5 mb-5">
            <Terminal
              size={30}
              className="text-cyan-400"
            />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            CLASS<span className="text-cyan-400">QUEST</span>
          </h1>

          <p className="text-gray-500 text-sm mt-2 font-mono">
            PRIVATE CODING ARENA
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border border-gray-800 bg-[#0c1016] p-7"
        >
          <h2 className="text-white font-bold mb-6">
            ACCESS ARENA
          </h2>

          {error && (
            <div className="mb-4 border border-red-500/30 bg-red-500/5 text-red-400 p-3 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="text-xs text-gray-500 font-mono block mb-2">
              USERNAME
            </label>

            <div className="relative">
              <User
                size={18}
                className="absolute left-3 top-3 text-gray-600"
              />

              <input
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                className="w-full bg-[#080b10] border border-gray-800 pl-10 pr-4 py-3 text-white outline-none focus:border-cyan-400"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="text-xs text-gray-500 font-mono block mb-2">
              PASSWORD
            </label>

            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-3 text-gray-600"
              />

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="w-full bg-[#080b10] border border-gray-800 pl-10 pr-4 py-3 text-white outline-none focus:border-cyan-400"
                required
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-black font-bold py-3 transition"
          >
            {loading ? "AUTHENTICATING..." : "ENTER ARENA →"}
          </button>

          <p className="text-center text-gray-600 text-xs mt-5 font-mono">
            PRIVATE CLASS ACCESS • NO PUBLIC REGISTRATION
          </p>
        </form>
      </div>
    </main>
  );
}