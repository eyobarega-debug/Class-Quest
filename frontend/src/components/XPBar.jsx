export default function XPBar({
  xp = 0,
  level = 1,
}) {
  const xpPerLevel = 1000;
  const currentXP = xp % xpPerLevel;
  const percentage = (currentXP / xpPerLevel) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2 text-xs font-mono">
        <span className="text-[var(--color-ink-muted)] tracking-wide">XP PROGRESS</span>

        <span className="text-[var(--color-brass-dark)] font-semibold">
          {currentXP} / {xpPerLevel}
        </span>
      </div>

      <div className="h-3 bg-[var(--color-vellum-deep)] border border-[var(--color-line)] p-[2px] flex gap-[2px]">
        {Array.from({ length: 20 }).map((_, index) => {
          const active =
            index < Math.round(percentage / 5);

          return (
            <div
              key={index}
              className={`flex-1 ${
                active
                  ? "bg-[var(--color-brass)]"
                  : "bg-[var(--color-vellum-raised)]"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
