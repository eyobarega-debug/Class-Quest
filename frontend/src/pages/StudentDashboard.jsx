import { useEffect, useState } from "react";

import {
  Zap,
  Trophy,
  Target,
  Flame,
  Swords,
  Sparkles,
  Clock,
  Lock,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

import XPBar from "../components/ui/XPBar";
import LevelBadge from "../components/ui/LevelBadge";
import StatCard from "../components/ui/StatCard";


function greeting() {
  const h = new Date().getHours();

  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";

  return "Good evening";
}


export default function StudentDashboard() {
  console.log("🔥 STUDENT DASHBOARD FILE IS RUNNING");

  const { user } = useAuth();

  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [examError, setExamError] = useState("");


  // ==========================================
  // LOAD EXAMS
  // ==========================================

  useEffect(() => {
    async function loadExams() {
      try {
        setLoadingExams(true);
        setExamError("");

        const examList = await api.exams();

        setExams(Array.isArray(examList) ? examList : []);
      } catch (error) {
        console.error("Failed to load exams:", error);

        setExamError(
          error.message || "Failed to load exams."
        );
      } finally {
        setLoadingExams(false);
      }
    }

    if (user) {
      loadExams();
    }
  }, [user]);


  if (!user) {
    return null;
  }


  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ==========================================
          WELCOME
      ========================================== */}

      <section className="rounded-2xl border border-border-subtle bg-surface p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-5">

        <LevelBadge
          level={user.level}
          size={64}
        />

        <div className="flex-1 min-w-0">

          <h1 className="font-display font-bold text-xl">
            {greeting()}, {user.name.split(" ")[0]} 👋
          </h1>

          <p className="text-text-muted text-sm mt-0.5">
            Ready for your next challenge?
          </p>

          <div className="mt-3 max-w-md">

            <XPBar
              percent={user.xpPercent}
              xpIntoLevel={user.xpIntoLevel}
              xpForNextLevel={user.xpForNextLevel}
            />

          </div>

        </div>

      </section>


      {/* ==========================================
          PLAYER STATS
      ========================================== */}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">

        <StatCard
          icon={Sparkles}
          label="Level"
          value={user.level}
          accent="xp"
        />

        <StatCard
          icon={Zap}
          label="Total XP"
          value={user.xp.toLocaleString()}
          accent="xp"
        />

        <StatCard
          icon={Trophy}
          label="Rating"
          value={user.rating}
          accent="rating"
          sublabel="Bronze"
        />

        <StatCard
          icon={Flame}
          label="Streak"
          value={`${user.streak}d`}
          accent="warn"
        />

      </section>


      {/* ==========================================
          AVAILABLE EXAMS
      ========================================== */}

      <section className="rounded-2xl border border-border-subtle bg-surface p-6">

        <div className="flex items-center justify-between mb-5">

          <div>

            <h2 className="font-display font-semibold text-lg">
              Available Exams
            </h2>

            <p className="text-sm text-text-muted mt-1">
              Exams created by your instructor.
            </p>

          </div>

          <Target
            size={20}
            className="text-text-muted"
          />

        </div>


        {/* LOADING */}

        {loadingExams && (

          <div className="rounded-xl border border-dashed border-border-subtle p-6 text-center">

            <p className="text-sm text-text-muted">
              Loading exams...
            </p>

          </div>

        )}


        {/* ERROR */}

        {!loadingExams && examError && (

          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">

            <p className="text-sm text-red-400">
              {examError}
            </p>

          </div>

        )}


        {/* NO EXAMS */}

        {!loadingExams &&
          !examError &&
          exams.length === 0 && (

            <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center">

              <Target
                className="mx-auto mb-3 text-text-muted"
                size={28}
              />

              <p className="text-sm text-text-muted">
                No exams are available right now.
              </p>

              <p className="text-xs text-text-muted mt-1">
                Your instructor has not created an exam yet.
              </p>

            </div>

        )}


        {/* EXAMS */}

        {!loadingExams &&
          !examError &&
          exams.length > 0 && (

            <div className="space-y-3">

              {exams.map((exam) => (

                <div
                  key={exam.id}
                  className="rounded-xl border border-border-subtle bg-surface-raised p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >

                  {/* EXAM INFORMATION */}

                  <div className="min-w-0">

                    <h3 className="font-semibold text-base">
                      {exam.title}
                    </h3>

                    <p className="text-sm text-text-muted mt-1">
                      {exam.description ||
                        "No description provided."}
                    </p>


                    <div className="flex flex-wrap items-center gap-3 mt-3">

                      <span className="flex items-center gap-1 text-xs text-text-muted">

                        <Clock size={13} />

                        {exam.duration} minutes

                      </span>


                      {exam.requiresPassword && (

                        <span className="flex items-center gap-1 text-xs text-text-muted">

                          <Lock size={13} />

                          Password required

                        </span>

                      )}

                    </div>

                  </div>


                  {/* START EXAM */}

                  <button
                    type="button"
                    onClick={() => {
                      console.log(
                        "Selected exam:",
                        exam.id
                      );
                    }}
                    className="shrink-0 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition"
                  >
                    Start Exam
                  </button>

                </div>

              ))}

            </div>

        )}

      </section>


      {/* ==========================================
          TODAY'S CHALLENGE
      ========================================== */}

      <section className="rounded-2xl border border-border-subtle bg-surface p-6">

        <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wide font-medium mb-3">

          <Target size={14} />

          Today's Challenge

        </div>

        <div className="rounded-xl border border-dashed border-border-subtle bg-surface-raised/40 p-6 text-center">

          <Swords
            className="mx-auto mb-2 text-text-muted"
            size={22}
          />

          <p className="text-sm text-text-muted">
            The Coding Arena unlocks in Phase 2, once
            challenges and the code editor are built.
          </p>

        </div>

      </section>


      {/* ==========================================
          RECENT ACTIVITY
      ========================================== */}

      <section className="rounded-2xl border border-border-subtle bg-surface p-6">

        <h2 className="font-display font-semibold text-sm mb-3">
          Recent Activity
        </h2>

        <p className="text-sm text-text-muted">
          Nothing yet — your solved challenges,
          achievements, and battle results will show
          up here once submissions are wired up.
        </p>

      </section>

    </div>
  );
}