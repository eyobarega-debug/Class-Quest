import { Users, Code2, ShieldCheck } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div>
      <p className="text-cyan-400 text-xs font-mono mb-2">
        ADMIN CONTROL CENTER
      </p>

      <h1 className="text-3xl font-bold text-white mb-8">
        CLASSQUEST ADMIN
      </h1>

      <div className="grid md:grid-cols-3 gap-5">
        <Card
          icon={Users}
          title="STUDENTS"
          description="Manage students and account access."
          link="/admin/students"
        />

        <Card
          icon={Code2}
          title="CHALLENGES"
          description="Create and manage coding challenges."
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
    <a
      href={link || "#"}
      className="border border-gray-800 bg-[#0d1117] p-6 hover:border-cyan-400/50 transition"
    >
      <Icon className="text-cyan-400" size={25} />

      <h2 className="text-white font-bold mt-5">
        {title}
      </h2>

      <p className="text-gray-500 text-sm mt-2">
        {description}
      </p>
    </a>
  );
}