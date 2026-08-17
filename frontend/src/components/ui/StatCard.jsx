export default function StatCard({
  icon: Icon,
  label,
  value,
  accent = "xp",
  sublabel,
}) {
  const accentColor = {
    xp: "text-[#8B5CF6]",
    rating: "text-[#3B82F6]",
    warn: "text-[#F59E0B]",
    danger: "text-[#EF4444]",
    success: "text-[#10B981]",
    muted: "text-[#0F172A]",
  }[accent] || "text-[#0F172A]";

  const iconBackground = {
    xp: "bg-[#F5F3FF] border-[#DDD6FE]",
    rating: "bg-[#EFF6FF] border-[#DBEAFE]",
    warn: "bg-[#FFFBEB] border-[#FEF3C7]",
    danger: "bg-[#FEF2F2] border-[#FECACA]",
    success: "bg-[#ECFDF5] border-[#A7F3D0]",
    muted: "bg-[#F1F5F9] border-[#E2E8F0]",
  }[accent] || "bg-[#F1F5F9] border-[#E2E8F0]";

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 flex items-start gap-3 shadow-sm hover:shadow-md hover:border-[#CBD5E1] transition">
      
      {Icon && (
        <div
          className={`rounded-lg border p-2 ${iconBackground}`}
        >
          <Icon
            size={18}
            strokeWidth={2}
            className={accentColor}
          />
        </div>
      )}

      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-[#64748B] font-medium">
          {label}
        </p>

        <p
          className={`font-mono font-bold text-2xl ${accentColor} truncate`}
        >
          {value}
        </p>

        {sublabel && (
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
