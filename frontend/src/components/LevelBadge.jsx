export default function LevelBadge({ level = 1 }) {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-cyan-400/10 border border-cyan-400/60"
        style={{
          clipPath:
            "polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0 50%)",
        }}
      />

      <div className="relative text-center">
        <div className="text-[9px] text-cyan-400 font-mono">
          LVL
        </div>

        <div className="text-xl font-bold text-white">
          {level}
        </div>
      </div>
    </div>
  );
}