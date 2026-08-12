// The signature visual motif of ClassQuest: a segmented, glowing
// progress bar (styled in index.css as .xp-bar-track / .xp-bar-fill)
// instead of a plain rounded <div>. Used on the dashboard and the
// profile page so both feel like the same product.
export default function XPBar({ percent, xpIntoLevel, xpForNextLevel, size = 'md' }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const height = size === 'lg' ? 'h-4' : 'h-2.5';

  return (
    <div className="w-full">
      <div className={`xp-bar-track w-full ${height} rounded-full overflow-hidden border border-border-subtle`}>
        <div
          className={`xp-bar-fill ${height} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {typeof xpIntoLevel === 'number' && typeof xpForNextLevel === 'number' && (
        <div className="mt-1.5 flex justify-between font-mono text-xs text-text-muted">
          <span>{xpIntoLevel} / {xpForNextLevel} XP</span>
          <span>{clamped}%</span>
        </div>
      )}
    </div>
  );
}
