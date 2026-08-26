import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function AdminStudents() {
  const [students, setStudents] = useState([]);

  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      const data = await api.students();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function createStudent(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    try {
      await api.createStudent(form);

      setMessage("Student created successfully.");

      setForm({
        username: "",
        fullName: "",
        email: "",
        password: "",
      });

      loadStudents();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleStudent(student) {
    setError("");
    setMessage("");

    try {
      await api.updateStudentStatus(student.id, !student.isActive);

      setMessage(
        student.isActive
          ? `${student.username} has been disabled.`
          : `${student.username} has been enabled.`
      );

      loadStudents();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteStudent(student) {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${student.name || student.username}?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.deleteStudent(student.id);

      setMessage(`Student "${student.username}" deleted successfully.`);

      loadStudents();
    } catch (err) {
      setError(err.message);
    }
  }

  async function resetPassword(student) {
    const confirmed = window.confirm(
      `Reset the password for ${student.name || student.username}? A new temporary password will be generated.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const data = await api.resetStudentPassword(student.id);

      setMessage(
        `Password reset for ${student.username}. Temporary password: "${data.temporaryPassword}" — share this with the student now, it won't be shown again.`
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function resetXp(student) {
    const confirmed = window.confirm(
      `Reset ${student.name || student.username}'s season XP to 0? This starts them fresh for a new week/challenge. Their All-Time XP and submission history are unaffected.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.resetStudentXp(student.id);

      setMessage(`${student.username}'s XP has been reset to 0.`);

      loadStudents();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-display font-bold text-[var(--color-ink)] mb-8">
        Student Management
      </h1>

      <div className="grid xl:grid-cols-3 gap-6">
        {/* CREATE STUDENT */}
        <form
          onSubmit={createStudent}
          className="ledger-card p-6"
        >
          <h2 className="text-[var(--color-ink)] font-display font-bold mb-5">
            Create Student
          </h2>

          {error && (
            <div className="text-[var(--color-red-dark)] text-sm mb-4">
              {error}
            </div>
          )}

          {message && (
            <div className="text-[var(--color-teal-dark)] text-sm mb-4">
              {message}
            </div>
          )}

          <input
            placeholder="Full name"
            value={form.fullName}
            onChange={(e) =>
              setForm({ ...form, fullName: e.target.value })
            }
            className="input"
            required
          />

          <input
            placeholder="Username"
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
            className="input mt-3"
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            className="input mt-3"
            required
          />

          <input
            type="password"
            placeholder="Temporary password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            className="input mt-3"
            required
          />

          <button
            type="submit"
            className="btn-primary w-full mt-4"
          >
            CREATE STUDENT
          </button>
        </form>

        {/* STUDENT LIST */}
        <div className="xl:col-span-2 ledger-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-line)]">
              <tr className="text-left text-[var(--color-ink-muted)] font-mono text-xs">
                <th className="p-4">NAME</th>
                <th className="p-4">USERNAME</th>
                <th className="p-4">XP</th>
                <th className="p-4">STATUS</th>
                <th className="p-4">ACTION</th>
              </tr>
            </thead>

            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-8 text-center text-[var(--color-ink-muted)]"
                  >
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-[var(--color-line)]"
                  >
                    <td className="p-4 text-[var(--color-ink)]">
                      {student.name}
                    </td>

                    <td className="p-4 text-[var(--color-ink-muted)]">
                      {student.username}
                    </td>

                    <td className="p-4 text-[var(--color-brass-dark)] font-medium">
                      {student.xp}
                    </td>

                    <td className="p-4">
                      <span
                        className={
                          student.isActive
                            ? "text-[var(--color-teal-dark)]"
                            : "text-[var(--color-red-dark)]"
                        }
                      >
                        {student.isActive
                          ? "ACTIVE"
                          : "DISABLED"}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        {/* ENABLE / DISABLE */}
                        <button
                          type="button"
                          onClick={() => toggleStudent(student)}
                          className="text-xs border border-[var(--color-line-strong)] px-3 py-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-brass)]"
                        >
                          {student.isActive
                            ? "DISABLE"
                            : "ENABLE"}
                        </button>

                        {/* RESET PASSWORD */}
                        <button
                          type="button"
                          onClick={() => resetPassword(student)}
                          className="text-xs border border-[var(--color-line-strong)] px-3 py-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-brass)]"
                        >
                          RESET PASSWORD
                        </button>

                        {/* RESET XP */}
                        <button
                          type="button"
                          onClick={() => resetXp(student)}
                          className="text-xs border border-[var(--color-line-strong)] px-3 py-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-brass)]"
                        >
                          RESET XP
                        </button>

                        {/* DELETE */}
                        <button
                          type="button"
                          onClick={() => deleteStudent(student)}
                          className="text-xs border border-[var(--color-red)]/40 px-3 py-2 text-[var(--color-red-dark)] hover:bg-[var(--color-red)] hover:text-[var(--color-vellum)]"
                        >
                          DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}