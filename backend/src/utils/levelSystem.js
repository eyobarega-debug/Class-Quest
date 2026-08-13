// ------------------------------------------------------------------
// Level system. Every other file asks THIS file "what level is 820
// XP?" instead of hard-coding level math. Change the XP curve here
// only.
// ------------------------------------------------------------------

const LEVEL_THRESHOLDS = [
  0,    // level 0 (unused)
  0,    // Level 1
  100,  // Level 2
  250,  // Level 3
  450,  // Level 4
  700,  // Level 5
  1000, // Level 6
  1350, // Level 7
  1750, // Level 8
  2200, // Level 9
  2700, // Level 10
];

function extendedThreshold(level) {
  if (level < LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[level];
  const last = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const lastIndex = LEVEL_THRESHOLDS.length - 1;
  const extraLevels = level - lastIndex;
  return Math.round(last + extraLevels * 600 * (1 + extraLevels * 0.05));
}

export function levelForXp(xp) {
  let level = 1;
  while (extendedThreshold(level + 1) <= xp) {
    level += 1;
  }
  return level;
}

export function getXpProgress(xp) {
  const level = levelForXp(xp);
  const currentLevelFloor = extendedThreshold(level);
  const nextLevelCeiling = extendedThreshold(level + 1);
  const xpIntoLevel = xp - currentLevelFloor;
  const xpForThisLevel = nextLevelCeiling - currentLevelFloor;
  const percent =
    xpForThisLevel === 0
      ? 100
      : Math.min(100, Math.round((xpIntoLevel / xpForThisLevel) * 100));

  return {
    level,
    xp,
    xpIntoLevel,
    xpForNextLevel: xpForThisLevel,
    xpRemaining: Math.max(0, nextLevelCeiling - xp),
    percent,
  };
}

export { LEVEL_THRESHOLDS };