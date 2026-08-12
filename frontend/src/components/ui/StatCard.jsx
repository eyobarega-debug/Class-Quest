export default function StatCard({ icon: Icon, label, value, accent = 'xp', sublabel }) {
  const accentColor = {
    xp: 'text-xp',
    rating: 'text-rating',
    warn: 'text-warn',
    danger: 'text-danger',
    muted: 'text-text-primary',
  }[accent];

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4 flex items-start gap-3">
      {Icon && (
        <div className={`rounded-lg bg-surface-raised p-2 ${accentColor}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-text-muted font-medium">{label}</p>
        <p className={`font-mono font-bold text-2xl ${accentColor} truncate`}>{value}</p>
        {sublabel && <p className="text-xs text-text-muted mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}
