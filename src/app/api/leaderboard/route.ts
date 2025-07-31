import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateLeaderboard, calculateComponentScores } from "@/lib/scoring";
import { TransactionDataPoint } from "@/types";
import { JsonValue } from "@prisma/client/runtime/library";

type UserWithMetrics = {
  walletAddress: string;
  txCount: number;
  gasSpentMON: number;
  totalVolume: number;
  nftBagValue: number;
  isDay1User: boolean;
  longestStreak: number;
  daysActive: number;
  transactionHistory: JsonValue;
  totalScore: number;
  rank: number | null;
  percentile: number;
};

type UserMetricsForScoring = {
  txCount: number;
  gasSpentMON: number;
  totalVolume: number;
  nftBagValue: number;
  isDay1User: boolean;
  longestStreak: number;
  daysActive: number;
  transactionHistory: TransactionDataPoint[];
};

type UserWithMetricsForScoring = {
  walletAddress: string;
  metrics: UserMetricsForScoring;
};

export async function GET() {
  try {
    // Get all users with their metrics
    const users = await prisma.user.findMany({
      orderBy: {
        totalScore: "desc",
      },
      select: {
        walletAddress: true,
        txCount: true,
        gasSpentMON: true,
        totalVolume: true,
        nftBagValue: true,
        isDay1User: true,
        longestStreak: true,
        daysActive: true,
        transactionHistory: true,
        totalScore: true,
        rank: true,
        percentile: true,
      },
    });

    // Convert to the format expected by the scoring system
    const usersWithMetrics: UserWithMetricsForScoring[] = users.map(
      (user: UserWithMetrics) => ({
        walletAddress: user.walletAddress,
        metrics: {
          txCount: user.txCount,
          gasSpentMON: user.gasSpentMON,
          totalVolume: user.totalVolume,
          nftBagValue: user.nftBagValue,
          isDay1User: user.isDay1User,
          longestStreak: user.longestStreak,
          daysActive: user.daysActive,
          transactionHistory: (user.transactionHistory as unknown as TransactionDataPoint[]) || [],
        },
      })
    );

    // Calculate scores for all users
    const usersWithScores = usersWithMetrics.map(
      (user: UserWithMetricsForScoring) => ({
        walletAddress: user.walletAddress,
        metrics: user.metrics,
        scores: calculateComponentScores(
          user.metrics,
          usersWithMetrics.map((u: UserWithMetricsForScoring) => u.metrics)
        ),
      })
    );

    // Generate leaderboard
    const leaderboard = generateLeaderboard(usersWithScores);

    return NextResponse.json({
      leaderboard,
      totalUsers: leaderboard.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
