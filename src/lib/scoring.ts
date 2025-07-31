import { TransactionDataPoint } from "@/types";

export interface UserMetrics {
  txCount: number;
  gasSpentMON: number;
  totalVolume: number;
  nftBagValue: number;
  isDay1User: boolean;
  longestStreak: number;
  daysActive: number;
  transactionHistory?: TransactionDataPoint[];
}

export interface UserScore {
  volumeScore: number;
  gasScore: number;
  transactionScore: number;
  nftScore: number;
  daysActiveScore: number;
  streakScore: number;
  day1BonusScore: number;
  totalScore: number;
}

export interface LeaderboardEntry {
  userNumber: number; // Position number for display (not a fixed rank)
  walletAddress: string;
  totalScore: number;
  metrics: UserMetrics;
  scores: UserScore;
}

// Weight distribution for scoring
const WEIGHTS = {
  volume: 0.25, // 25% - High weight for economic activity
  gas: 0.2, // 20% - Commitment and activity level
  transactions: 0.15, // 15% - Consistent usage
  nft: 0.15, // 15% - Investment and taste
  daysActive: 0.1, // 10% - Consistency over time
  streak: 0.1, // 10% - Sustained engagement
  day1Bonus: 0.05, // 5% - Early adoption bonus
} as const;

/**
 * Calculate days active from transaction history
 */
export function calculateDaysActive(
  transactionHistory: TransactionDataPoint[]
): number {
  if (!transactionHistory || transactionHistory.length === 0) return 0;

  const daysWithTransactions = transactionHistory.filter(
    (day) => day.transactions > 0
  );
  return daysWithTransactions.length;
}

/**
 * Normalize a value to 0-100 scale using percentile ranking
 */
export function normalizeToPercentile(
  value: number,
  allValues: number[],
  useLogTransform: boolean = false
): number {
  if (allValues.length === 0) return 0;

  // If there's only one user, give them a perfect score for that metric
  if (allValues.length === 1) return 100;

  let normalizedValue = value;
  let normalizedAllValues = allValues;

  // Apply log transformation for volume to prevent whale dominance
  if (useLogTransform) {
    normalizedValue = Math.log(1 + value);
    normalizedAllValues = allValues.map((v) => Math.log(1 + v));
  }

  // Sort values to find percentile
  const sortedValues = [...normalizedAllValues].sort((a, b) => a - b);
  const rank = sortedValues.findIndex((v) => v >= normalizedValue);

  // Calculate percentile (0-100)
  const percentile = rank === -1 ? 0 : (rank / sortedValues.length) * 100;

  return Math.round(percentile * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate individual component scores
 */
export function calculateComponentScores(
  userMetrics: UserMetrics,
  allUsersMetrics: UserMetrics[]
): UserScore {
  // Extract all values for normalization
  const allVolumes = allUsersMetrics.map((u) => u.totalVolume);
  const allGasSpent = allUsersMetrics.map((u) => u.gasSpentMON);
  const allTxCounts = allUsersMetrics.map((u) => u.txCount);
  const allNftValues = allUsersMetrics.map((u) => u.nftBagValue);
  const allDaysActive = allUsersMetrics.map((u) => u.daysActive);
  const allStreaks = allUsersMetrics.map((u) => u.longestStreak);

  // Calculate normalized scores
  const volumeScore = normalizeToPercentile(
    userMetrics.totalVolume,
    allVolumes,
    true
  );
  const gasScore = normalizeToPercentile(
    userMetrics.gasSpentMON,
    allGasSpent,
    true
  );
  const transactionScore = normalizeToPercentile(
    userMetrics.txCount,
    allTxCounts
  );
  const nftScore = normalizeToPercentile(
    userMetrics.nftBagValue,
    allNftValues,
    true
  );
  const daysActiveScore = normalizeToPercentile(
    userMetrics.daysActive,
    allDaysActive
  );
  const streakScore = normalizeToPercentile(
    userMetrics.longestStreak,
    allStreaks
  );

  // Day 1 bonus is binary (100 if day 1, 0 if not)
  const day1BonusScore = userMetrics.isDay1User ? 100 : 0;

  // Calculate weighted total score
  const totalScore =
    volumeScore * WEIGHTS.volume +
    gasScore * WEIGHTS.gas +
    transactionScore * WEIGHTS.transactions +
    nftScore * WEIGHTS.nft +
    daysActiveScore * WEIGHTS.daysActive +
    streakScore * WEIGHTS.streak +
    day1BonusScore * WEIGHTS.day1Bonus;

  return {
    volumeScore,
    gasScore,
    transactionScore,
    nftScore,
    daysActiveScore,
    streakScore,
    day1BonusScore,
    totalScore: Math.round(totalScore * 100) / 100, // Round to 2 decimal places
  };
}

/**
 * Generate leaderboard with rankings
 */
export function generateLeaderboard(
  usersWithScores: Array<{
    walletAddress: string;
    metrics: UserMetrics;
    scores: UserScore;
  }>
): LeaderboardEntry[] {
  // Sort by total score (descending)
  const sortedUsers = [...usersWithScores].sort(
    (a, b) => b.scores.totalScore - a.scores.totalScore
  );

  return sortedUsers.map((user, index) => {
    const userNumber = index + 1;

    return {
      userNumber,
      walletAddress: user.walletAddress,
      totalScore: user.scores.totalScore,
      metrics: user.metrics,
      scores: user.scores,
    };
  });
}

/**
 * Format wallet address for display
 */
export function formatWalletAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get score breakdown for display
 */
export function getScoreBreakdown(scores: UserScore) {
  return [
    { label: "Volume", score: scores.volumeScore, weight: WEIGHTS.volume },
    { label: "Gas Spent", score: scores.gasScore, weight: WEIGHTS.gas },
    {
      label: "Transactions",
      score: scores.transactionScore,
      weight: WEIGHTS.transactions,
    },
    { label: "NFT Value", score: scores.nftScore, weight: WEIGHTS.nft },
    {
      label: "Days Active",
      score: scores.daysActiveScore,
      weight: WEIGHTS.daysActive,
    },
    { label: "Streak", score: scores.streakScore, weight: WEIGHTS.streak },
    {
      label: "Day 1 Bonus",
      score: scores.day1BonusScore,
      weight: WEIGHTS.day1Bonus,
    },
  ];
}
