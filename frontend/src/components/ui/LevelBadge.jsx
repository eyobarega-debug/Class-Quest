// A hexagon reads as "game badge" much more than a circle would -
// it's the same shape language competitive-programming platforms
// and game UIs use for rank icons. Pure CSS clip-path, no image.
export default function LevelBadge({ level, size = 56 }) {
  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          background: 'linear-gradient(160deg, var(--color-surface-raised), var(--color-void))',
          border: '1px solid var(--color-xp)',
          boxShadow: '0 0 14px rgba(52, 229, 168, 0.35)',
        }}
      />
      <div className="relative flex flex-col items-center leading-none">
        <span className="font-mono font-bold text-xp" style={{ fontSize: size * 0.32 }}>
          {level}
        </span>
        <span className="font-mono text-[9px] tracking-widest text-text-muted mt-0.5">LVL</span>
      </div>
    </div>
  );
}
