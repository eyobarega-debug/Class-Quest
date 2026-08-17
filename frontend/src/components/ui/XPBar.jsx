// ClassQuest XP progress bar
// Purple represents XP, levels, achievements,
// and other gamification elements.

export default function XPBar({
  percent,
  xpIntoLevel,
  xpForNextLevel,
  size = "md",
}) {
  const clamped = Math.max(
    0,
    Math.min(100, percent)
  );

  const height =
    size === "lg" ? "h-4" : "h-2.5";

  return (
    <div className="w-full">

      {/* XP BAR */}

      <div
        className={`
          w-full
          ${height}
          rounded-full
          overflow-hidden
          border
          border-[#E2E8F0]
          bg-[#F1F5F9]
        `}
      >
        <div
          className={`
            ${height}
            rounded-full
            transition-all
            duration-700
            ease-out
            bg-[#8B5CF6]
          `}
          style={{
            width: `${clamped}%`,
          }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* XP INFORMATION */}

      {typeof xpIntoLevel === "number" &&
        typeof xpForNextLevel === "number" && (
          <div className="mt-1.5 flex justify-between font-mono text-xs text-[#64748B]">
            <span>
              {xpIntoLevel} / {xpForNextLevel} XP
            </span>

            <span className="text-[#8B5CF6] font-semibold">
              {clamped}%
            </span>
          </div>
        )}
    </div>
  );
}
