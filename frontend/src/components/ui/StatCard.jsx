export default function StatCard({
  icon: Icon,
  label,
  value,
  accent = "xp",
  sublabel,
}) {
  const accentColor = {
    xp: "text-[#A855F7]",
    rating: "text-[#38BDF8]",
    warn: "text-[#FBBF24]",
    danger: "text-[#F87171]",
    success: "text-[#34D399]",
    muted: "text-[#94A3B8]",
  }[accent] || "text-[#94A3B8]";

  const iconBackground = {
    xp: "bg-[#A855F7]/10 border-[#A855F7]/30",
    rating: "bg-[#38BDF8]/10 border-[#38BDF8]/30",
    warn: "bg-[#FBBF24]/10 border-[#FBBF24]/30",
    danger: "bg-[#F87171]/10 border-[#F87171]/30",
    success: "bg-[#34D399]/10 border-[#34D399]/30",
    muted: "bg-[#1E293B] border-[#334155]",
  }[accent] || "bg-[#1E293B] border-[#334155]";

  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#121723] p-4 flex items-start gap-3 shadow-lg hover:border-[#334155] hover:bg-[#1A2030] transition duration-200">
      
      {Icon && (
        <div className={`rounded-lg border p-2.5 ${iconBackground}`}>
          <Icon
            size={18}
            strokeWidth={2}
            className={accentColor}
          />
        </div>
      )}

      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-[#94A3B8] font-medium">
          {label}
        </p>

        <p className={`font-mono font-bold text-2xl ${accentColor} truncate mt-0.5`}>
          {value}
        </p>

        {sublabel && (
          <p className="text-xs text-[#64748B] mt-0.5">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}