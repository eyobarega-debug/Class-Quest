// ClassQuest level badge
// Purple is used for gamification elements such as levels, XP,
// achievements, and progression.

export default function LevelBadge({ level, size = 56 }) {
  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Hexagon */}
      <div
        className="absolute inset-0"
        style={{
          clipPath:
            "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background:
            "linear-gradient(160deg, #F5F3FF, #FFFFFF)",
        }}
      />

      {/* Hexagon border */}
      <div
        className="absolute inset-[1px]"
        style={{
          clipPath:
            "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background: "#FFFFFF",
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col items-center leading-none">
        <span
          className="font-mono font-bold text-[#8B5CF6]"
          style={{
            fontSize: size * 0.32,
          }}
        >
          {level}
        </span>

        <span className="font-mono text-[9px] tracking-widest text-[#64748B] mt-0.5">
          LVL
        </span>
      </div>
    </div>
  );
}