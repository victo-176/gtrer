const RANKS = {
  INITIATE: { name: 'initiate', minPoints: 0, maxPoints: 99 },
  HACKER: { name: 'hacker', minPoints: 100, maxPoints: 499 },
  ELITE: { name: 'elite', minPoints: 500, maxPoints: 1999 },
  ADMIN: { name: 'admin', minPoints: Infinity, maxPoints: Infinity }
};

function calculateRank(points) {
  if (points >= 500) return 'elite';
  if (points >= 100) return 'hacker';
  return 'initiate';
}

function getNextRankThreshold(currentPoints) {
  if (currentPoints < 100) return 100;
  if (currentPoints < 500) return 500;
  return null;
}

function getRankInfo(rankName) {
  return RANKS[rankName.toUpperCase()] || RANKS.INITIATE;
}

module.exports = {
  RANKS,
  calculateRank,
  getNextRankThreshold,
  getRankInfo
};