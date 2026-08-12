// ------------------------------------------------------------------
// Level system
//
// The brief (section 15) asks for this to be "easy to change later".
// So instead of hard-coding level math all over the codebase, every
// other file asks THIS file "what level is 820 XP?" or "how much XP
// until the next level?". If you want to change the XP curve later,
// this is the only file you touch.
// ------------------------------------------------------------------

// XP required to REACH each level. Index 0 is unused so that
// LEVEL_THRESHOLDS[n] really does mean "XP needed for level n".
// Feel free to extend this list or replace it with a formula.
const LEVEL_THRESHOLDS = [
  0, // level 0 (unused)
  0, // Level 1
  100, // Level 2
  250, // Level 3
  450, // Level 4
  700, // Level 5
  1000, // Level 6
  1350, // Level 7
  1750, // Level 8
  2200, // Level 9
  2700, // Level 10
];

// Beyond the table above, each level costs a bit more than the last.
// This keeps very high XP totals from breaking (undefined levels).
function extendedThreshold(level) {
  if (level < LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[level];
  const last = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const lastIndex = LEVEL_THRESHOLDS.length - 1;
  const extraLevels = level - lastIndex;
  // Each level past the table adds 10% more than the previous gap.
  return Math.round(last + extraLevels * 600 * (1 + extraLevels * 0.05));
}

/**
 * Given a total XP amount, return the level the student is at.
 */
function levelForXp(xp) {
  let level = 1;
  while (extendedThreshold(level + 1) <= xp) {
    level += 1;
  }
  return level;
}

/**
 * Given a total XP amount, return progress info for the UI:
 * current level, XP into the current level, XP needed for the
 * next level, and a 0-100 percentage for a progress bar.
 */
function getXpProgress(xp) {
  const level = levelForXp(xp);
  const currentLevelFloor = extendedThreshold(level);
  const nextLevelCeiling = extendedThreshold(level + 1);
  const xpIntoLevel = xp - currentLevelFloor;
  const xpForThisLevel = nextLevelCeiling - currentLevelFloor;
  const percent = xpForThisLevel === 0
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

module.exports = { levelForXp, getXpProgress, LEVEL_THRESHOLDS };
