// ClassQuest level badge - Modern Dark Obsidian Edition
export default function LevelBadge({ level, size = 56 }) {
  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Hexagon Outer Glow Border */}
      <div
        className="absolute inset-0"
        style={{
          clipPath:
            "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background:
            "linear-gradient(135deg, #A855F7 0%, #06B6D4 100%)",
        }}
      />

      {/* Hexagon Dark Surface Fill */}
      <div
        className="absolute inset-[1.5px]"
        style={{
          clipPath:
            "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background: "#121723",
        }}
      />

      {/* Level Number & Label */}
      <div className="relative flex flex-col items-center leading-none">
        <span
          className="font-mono font-bold text-[#A855F7] drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]"
          style={{
            fontSize: size * 0.34,
          }}
        >
          {level}
        </span>

        <span className="font-mono text-[9px] font-semibold tracking-widest text-[#94A3B8] mt-0.5">
          LVL
        </span>
      </div>
    </div>
  );
}