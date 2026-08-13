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
    try {
      await api.updateStudentStatus(student.id, !student.isActive);
      loadStudents();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">STUDENT MANAGEMENT</h1>

      <div className="grid xl:grid-cols-3 gap-6">
        <form onSubmit={createStudent} className="border border-gray-800 bg-[#0d1117] p-6">
          <h2 className="text-white font-bold mb-5">CREATE STUDENT</h2>

          {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
          {message && <div className="text-green-400 text-sm mb-4">{message}</div>}

          <input
            placeholder="Full name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="input"
            required
          />

          <input
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="input mt-3"
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input mt-3"
            required
          />

          <input
            type="password"
            placeholder="Temporary password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="input mt-3"
            required
          />

          <button className="w-full mt-4 bg-cyan-400 text-black font-bold py-3 hover:bg-cyan-300">
            CREATE STUDENT
          </button>
        </form>

        <div className="xl:col-span-2 border border-gray-800 bg-[#0d1117] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800">
              <tr className="text-left text-gray-500 font-mono text-xs">
                <th className="p-4">NAME</th>
                <th className="p-4">USERNAME</th>
                <th className="p-4">XP</th>
                <th className="p-4">STATUS</th>
                <th className="p-4">ACTION</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b border-gray-800">
                  <td className="p-4 text-white">{student.name}</td>
                  <td className="p-4 text-gray-400">{student.username}</td>
                  <td className="p-4 text-cyan-400">{student.xp}</td>
                  <td className="p-4">
                    <span className={student.isActive ? "text-green-400" : "text-red-400"}>
                      {student.isActive ? "ACTIVE" : "DISABLED"}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleStudent(student)}
                      className="text-xs border border-gray-700 px-3 py-2 text-gray-400 hover:text-white"
                    >
                      {student.isActive ? "DISABLE" : "ENABLE"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}