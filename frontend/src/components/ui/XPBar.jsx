export default function XPBar({
  percent,
  xpIntoLevel,
  xpForNextLevel,
  size = "md",
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const height = size === "lg" ? "h-3.5" : "h-2.5";

  return (
    <div className="w-full">
      {/* XP BAR TRACK */}
      <div
        className={`
          w-full
          ${height}
          rounded-full
          overflow-hidden
          border
          border-[#1E293B]
          bg-[#0E121C]
          p-[1px]
        `}
      >
        <div
          className={`
            ${height}
            rounded-full
            transition-all
            duration-700
            ease-out
            bg-gradient-to-r from-[#A855F7] to-[#06B6D4]
            shadow-[0_0_12px_rgba(168,85,247,0.4)]
          `}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* XP INFORMATION */}
      {typeof xpIntoLevel === "number" &&
        typeof xpForNextLevel === "number" && (
          <div className="mt-2 flex justify-between font-mono text-xs text-[#94A3B8]">
            <span>
              {xpIntoLevel} / {xpForNextLevel} XP
            </span>

            <span className="text-[#A855F7] font-semibold">
              {clamped}%
            </span>
          </div>
        )}
    </div>
  );
}