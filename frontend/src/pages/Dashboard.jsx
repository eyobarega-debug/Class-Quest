import {
  Code2,
  Flame,
  Trophy,
  Target,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import XPBar from "../components/XPBar";
import LevelBadge from "../components/LevelBadge";

export default function Dashboard() {
  const { user } = useAuth();

  const xp = user?.xp || 0;
  const level = user?.level || 1;

  return (
    <div>
      <div className="mb-8">
        <p className="text-cyan-400 text-xs font-mono mb-2">
          WELCOME BACK, CODER
        </p>

        <h1 className="text-3xl font-bold text-white">
          {user?.username || user?.name || "Student"}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 border border-gray-800 bg-[#0d1117] p-6">
          <div className="flex items-center gap-5 mb-7">
            <LevelBadge level={level} />

            <div>
              <p className="text-xs text-gray-500 font-mono">
                CURRENT LEVEL
              </p>

              <h2 className="text-2xl font-bold text-white">
                Level {level}
              </h2>
            </div>
          </div>

          <XPBar xp={xp} level={level} />
        </div>

        <div className="border border-gray-800 bg-[#0d1117] p-6">
          <p className="text-xs text-gray-500 font-mono">
            RATING
          </p>

          <div className="text-4xl font-bold text-cyan-400 mt-2">
            {user?.rating || 1000}
          </div>

          <div className="text-xs text-gray-600 mt-2">
            CODING ARENA RATING
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        <StatCard
          icon={Code2}
          label="SOLVED"
          value={user?.solved_count || 0}
        />

        <StatCard
          icon={Flame}
          label="STREAK"
          value={`${user?.streak || 0} DAYS`}
        />

        <StatCard
          icon={Trophy}
          label="RATING"
          value={user?.rating || 1000}
        />

        <StatCard
          icon={Target}
          label="LEVEL"
          value={level}
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="border border-gray-800 bg-[#0d1117] p-5">
      <Icon size={20} className="text-cyan-400 mb-4" />

      <div className="text-xs text-gray-500 font-mono">
        {label}
      </div>

      <div className="text-xl font-bold text-white mt-1">
        {value}
      </div>
    </div>
  );
}