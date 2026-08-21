export default function LevelBadge({ level = 1 }) {
  return (
    <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
      {/* Outer ring — pressed-wax edge */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 35% 30%, #c08d34, #a9761f 55%, #8a5f16 100%)",
          boxShadow: "0 2px 4px rgba(36, 30, 25, 0.35), inset 0 1px 1px rgba(255,255,255,0.25)",
        }}
      />
      {/* Inner impressed ring, like a stamped seal */}
      <div className="absolute inset-[5px] rounded-full border border-[#e7d3a3]/40" />

      <div className="relative text-center leading-none">
        <div className="text-[8px] font-mono tracking-widest text-[#f1e9dc]/80">
          LVL
        </div>
        <div className="font-display font-bold text-xl text-[#f1e9dc]">
          {level}
        </div>
      </div>
    </div>
  );
}
