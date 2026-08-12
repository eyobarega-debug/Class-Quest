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
        <span className="text-gray-400">XP PROGRESS</span>

        <span className="text-cyan-400">
          {currentXP} / {xpPerLevel}
        </span>
      </div>

      <div className="h-3 bg-[#151a22] border border-gray-800 p-[2px] flex gap-[2px]">
        {Array.from({ length: 20 }).map((_, index) => {
          const active =
            index < Math.round(percentage / 5);

          return (
            <div
              key={index}
              className={`flex-1 ${
                active
                  ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]"
                  : "bg-[#222832]"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}