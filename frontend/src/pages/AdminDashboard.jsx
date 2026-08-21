import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Code2,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { api } from "../services/api";

export default function AdminDashboard() {
  const [studentCount, setStudentCount] = useState(null);
  const [challengeCount, setChallengeCount] = useState(null);
  const [violations, setViolations] = useState([]);
  const [loadingViolations, setLoadingViolations] =
    useState(true);

  const [expandedStudents, setExpandedStudents] =
    useState({});

  // ==========================================
  // LOAD DASHBOARD
  // ==========================================

  const loadDashboard = useCallback(async () => {
    try {
      const students = await api.students();
      setStudentCount(students.length);
    } catch (error) {
      console.error(
        "Failed to load students:",
        error
      );
      setStudentCount(null);
    }

    try {
      const challenges = await api.challenges();
      setChallengeCount(challenges.length);
    } catch (error) {
      console.error(
        "Failed to load challenges:",
        error
      );
      setChallengeCount(null);
    }

    try {
      setLoadingViolations(true);

      const data = await api.violations({
        limit: 100,
        offset: 0,
      });

      setViolations(data || []);
    } catch (error) {
      console.error(
        "Failed to load violations:",
        error
      );
      setViolations([]);
    } finally {
      setLoadingViolations(false);
    }
  }, []);

  // ==========================================
  // AUTO REFRESH
  // ==========================================

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(() => {
      api
        .violations({
          limit: 100,
          offset: 0,
        })
        .then((data) => {
          setViolations(data || []);
        })
        .catch((error) => {
          console.error(
            "Violation refresh failed:",
            error
          );
        });
    }, 5000);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  // ==========================================
  // GROUP VIOLATIONS BY STUDENT
  // ==========================================

  const groupedViolations = violations.reduce(
    (groups, violation) => {
      const username =
        violation.username || "Unknown";

      if (!groups[username]) {
        groups[username] = [];
      }

      groups[username].push(violation);

      return groups;
    },
    {}
  );

  // ==========================================
  // TOGGLE STUDENT
  // ==========================================

  function toggleStudent(username) {
    setExpandedStudents((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
  }

  return (
    <div className="min-h-screen bg-white text-[#0F172A]">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="mb-8">

          <p className="text-[#3B82F6] text-xs font-mono tracking-wider mb-2">
            ADMIN CONTROL CENTER
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A]">
            CLASSQUEST ADMIN
          </h1>

          <p className="text-[#64748B] mt-2 text-sm">
            Monitor students, challenges, and
            classroom activity.
          </p>

        </div>

        {/* ==========================================
            STAT CARDS
        ========================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          <Card
            icon={Users}
            title="STUDENTS"
            description={
              studentCount === null
                ? "Manage students and account access."
                : `${studentCount} student(s) enrolled.`
            }
            link="/admin/students"
          />

          <Card
            icon={Code2}
            title="CHALLENGES"
            description={
              challengeCount === null
                ? "Create and manage coding challenges."
                : `${challengeCount} challenge(s) published.`
            }
            link="/challenges"
          />

          <Card
            icon={AlertTriangle}
            title="VIOLATIONS"
            description={`${violations.length} recent violation(s) recorded.`}
            danger={violations.length > 0}
          />

          <Card
            icon={ShieldCheck}
            title="SYSTEM"
            description="ClassQuest platform administration."
            success
          />

        </div>

        {/* ==========================================
            VIOLATION LOGS
        ========================================== */}

        <section className="mt-8 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] shadow-sm overflow-hidden">

          {/* SECTION HEADER */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-5 border-b border-[#E2E8F0] bg-white">

            <div>

              <p className="text-[#3B82F6] text-xs font-mono tracking-wider">
                MONITORING
              </p>

              <h2 className="text-xl font-bold text-[#0F172A] mt-1">
                VIOLATION LOGS
              </h2>

              <p className="text-[#64748B] text-xs mt-1">
                Review student activity violations.
              </p>

            </div>

            <button
              onClick={loadDashboard}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[#CBD5E1] bg-white text-[#64748B] text-xs font-mono hover:border-[#3B82F6] hover:text-[#3B82F6] hover:bg-[#EFF6FF] transition"
            >
              <RefreshCw size={14} />
              REFRESH
            </button>

          </div>

          {/* ==========================================
              LOADING
          ========================================== */}

          {loadingViolations ? (

            <div className="p-10 text-center bg-white">

              <RefreshCw
                className="mx-auto text-[#3B82F6] mb-3 animate-spin"
                size={28}
              />

              <p className="text-[#64748B] font-mono text-sm">
                LOADING VIOLATION LOGS...
              </p>

            </div>

          ) : violations.length === 0 ? (

            /* ==========================================
               NO VIOLATIONS
            ========================================== */

            <div className="p-10 text-center bg-white">

              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] mb-4">

                <ShieldCheck
                  className="text-[#10B981]"
                  size={25}
                />

              </div>

              <p className="text-[#0F172A] font-semibold">
                No violations recorded
              </p>

              <p className="text-[#64748B] text-sm mt-1">
                All monitored activity looks good.
              </p>

            </div>

          ) : (

            /* ==========================================
               VIOLATION TABLE
            ========================================== */

            <div className="overflow-x-auto bg-white">

              <table className="w-full text-left">

                <thead>

                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#64748B] font-mono">

                    <th className="px-5 py-3">
                      STUDENT / VIOLATIONS
                    </th>

                    <th className="px-5 py-3">
                      CHALLENGE
                    </th>

                    <th className="px-5 py-3">
                      EVENT
                    </th>

                    <th className="px-5 py-3">
                      APPLICATION
                    </th>

                    <th className="px-5 py-3">
                      SEVERITY
                    </th>

                    <th className="px-5 py-3">
                      TIME
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {Object.entries(
                    groupedViolations
                  ).map(
                    ([
                      username,
                      studentViolations,
                    ]) => (

                      <StudentViolationGroup
                        key={username}
                        username={username}
                        violations={
                          studentViolations
                        }
                        isExpanded={
                          !!expandedStudents[
                            username
                          ]
                        }
                        onToggle={() =>
                          toggleStudent(
                            username
                          )
                        }
                      />

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

    </div>
  );
}


// ==========================================
// ADMIN CARD
// ==========================================

function Card({
  icon: Icon,
  title,
  description,
  link,
  danger,
  success,
}) {
  const iconColor = danger
    ? "text-[#EF4444]"
    : success
    ? "text-[#10B981]"
    : "text-[#3B82F6]";

  const content = (
    <>
      <div className="flex items-center justify-between">

        <div className="w-11 h-11 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center">

          <Icon
            className={iconColor}
            size={22}
          />

        </div>

      </div>

      <h2 className="text-[#0F172A] font-semibold mt-5">
        {title}
      </h2>

      <p className="text-[#64748B] text-sm mt-2 leading-relaxed">
        {description}
      </p>
    </>
  );

  if (link) {
    return (
      <a
        href={link}
        className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 shadow-sm hover:border-[#BFDBFE] hover:shadow-md hover:bg-white transition block"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 shadow-sm hover:shadow-md transition">
      {content}
    </div>
  );
}


// ==========================================
// STUDENT VIOLATION GROUP
// ==========================================

function StudentViolationGroup({
  username,
  violations,
  isExpanded,
  onToggle,
}) {
  const firstViolation = violations[0];

  return (
    <>
      {/* ==========================================
          STUDENT HEADER
      ========================================== */}

      <tr
        onClick={onToggle}
        className="border-b border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] cursor-pointer transition"
      >

        <td
          colSpan="6"
          className="px-5 py-4"
        >

          <div className="flex items-center justify-between gap-4">

            {/* LEFT */}

            <div className="flex items-center gap-3 min-w-0">

              <div className="flex-shrink-0">

                {isExpanded ? (

                  <ChevronDown
                    size={18}
                    className="text-[#3B82F6]"
                  />

                ) : (

                  <ChevronRight
                    size={18}
                    className="text-[#64748B]"
                  />

                )}

              </div>

              <div className="min-w-0">

                <div className="text-[#0F172A] text-sm font-semibold">
                  {username}
                </div>

                <div className="text-[#94A3B8] text-xs font-mono mt-1">
                  User ID:{" "}
                  {firstViolation?.user_id ||
                    "Unknown"}
                </div>

              </div>

            </div>

            {/* VIOLATION COUNT */}

            <div className="flex-shrink-0">

              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#FFF7ED] border border-[#FED7AA] text-[#F59E0B] text-xs font-mono">

                {violations.length}{" "}

                {violations.length === 1
                  ? "violation"
                  : "violations"}

              </span>

            </div>

          </div>

        </td>

      </tr>

      {/* ==========================================
          INDIVIDUAL VIOLATIONS
      ========================================== */}

      {isExpanded &&
        violations.map((violation) => (

          <ViolationRow
            key={violation.id}
            violation={violation}
          />

        ))}

    </>
  );
}


// ==========================================
// INDIVIDUAL VIOLATION ROW
// ==========================================

function ViolationRow({ violation }) {
  const severity = (
    violation.severity || "medium"
  ).toLowerCase();

  // ==========================================
  // SEVERITY COLORS
  // ==========================================

  const severityClass =
    severity === "critical"
      ? "text-[#EF4444] bg-[#FEF2F2] border-[#FECACA]"
      : severity === "high"
      ? "text-[#EF4444] bg-[#FEF2F2] border-[#FECACA]"
      : severity === "medium"
      ? "text-[#F59E0B] bg-[#FFFBEB] border-[#FDE68A]"
      : "text-[#10B981] bg-[#ECFDF5] border-[#A7F3D0]";

  // ==========================================
  // DATE
  // ==========================================

  const date = violation.created_at
    ? new Date(
        violation.created_at
      ).toLocaleString()
    : "Unknown";

  return (
    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] transition">

      {/* STUDENT */}

      <td className="px-5 py-4">

        <div className="pl-7 flex items-center gap-2">

          <span className="text-[#CBD5E1] font-mono">
            └─
          </span>

          <span className="text-[#94A3B8] text-xs font-mono">
            violation
          </span>

        </div>

      </td>

      {/* CHALLENGE */}

      <td className="px-5 py-4">

        <div className="text-[#334155] text-sm">
          {violation.challenge_title ||
            "Unknown challenge"}
        </div>

      </td>

      {/* EVENT */}

      <td className="px-5 py-4">

        <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#EFF6FF] border border-[#DBEAFE] text-[#3B82F6] text-xs font-mono">

          {violation.event_type ||
            "UNKNOWN"}

        </span>

      </td>

      {/* APPLICATION */}

      <td className="px-5 py-4">

        <div className="text-[#334155] text-sm">

          {violation.application_name ||
            "Unknown"}

        </div>

        {violation.window_title && (

          <div className="text-[#94A3B8] text-xs max-w-xs truncate mt-1">

            {violation.window_title}

          </div>

        )}

      </td>

      {/* SEVERITY */}

      <td className="px-5 py-4">

        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-mono ${severityClass}`}
        >

          {severity.toUpperCase()}

        </span>

      </td>

      {/* TIME */}

      <td className="px-5 py-4">

        <span className="text-[#64748B] text-xs font-mono whitespace-nowrap">

          {date}

        </span>

      </td>

    </tr>
  );
}