import { useEffect, useState } from "react";
import { Users, Code2, ShieldCheck } from "lucide-react";
import { api } from "../services/api";

export default function AdminDashboard() {
  const [studentCount, setStudentCount] = useState(null);
  const [challengeCount, setChallengeCount] = useState(null);

  useEffect(() => {
    api.students().then((s) => setStudentCount(s.length)).catch(() => setStudentCount(null));
    api.challenges().then((c) => setChallengeCount(c.length)).catch(() => setChallengeCount(null));
  }, []);

  return (
    <div>
      <p className="text-cyan-400 text-xs font-mono mb-2">ADMIN CONTROL CENTER</p>
      <h1 className="text-3xl font-bold text-white mb-8">CLASSQUEST ADMIN</h1>

      <div className="grid md:grid-cols-3 gap-5">
        <Card
          icon={Users}
          title="STUDENTS"
          description={studentCount === null ? "Manage students and account access." : `${studentCount} student(s) enrolled.`}
          link="/admin/students"
        />

        <Card
          icon={Code2}
          title="CHALLENGES"
          description={challengeCount === null ? "Create and manage coding challenges." : `${challengeCount} challenge(s) published.`}
          link="/challenges"
        />

        <Card
          icon={ShieldCheck}
          title="SYSTEM"
          description="ClassQuest platform administration."
        />
      </div>
    </div>
  );
}

function Card({ icon: Icon, title, description, link }) {
  return (
    
      href={link || "#"}
      className="border border-gray-800 bg-[#0d1117] p-6 hover:border-cyan-400/50 transition"
    >
      <Icon className="text-cyan-400" size={25} />
      <h2 className="text-white font-bold mt-5">{title}</h2>
      <p className="text-gray-500 text-sm mt-2">{description}</p>
    </a>
  );
}