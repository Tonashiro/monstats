import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateComponentScores, generateLeaderboard } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  try {
    console.log("Starting ranking recalculation...");

    // Get all users with their metrics
    const users = await prisma.user.findMany({
      select: {
        id: true,
        walletAddress: true,
        txCount: true,
        gasSpentMON: true,
        totalVolume: true,
        nftBagValue: true,
        isDay1User: true,
        longestStreak: true,
        daysActive: true,
        transactionHistory: true,
      },
    });

    if (users.length === 0) {
      return NextResponse.json({ message: "No users found" });
    }

    // Convert to the format expected by the scoring system
    const usersWithMetrics = users.map((user) => ({
      walletAddress: user.walletAddress,
      metrics: {
        txCount: user.txCount,
        gasSpentMON: user.gasSpentMON,
        totalVolume: user.totalVolume,
        nftBagValue: user.nftBagValue,
        isDay1User: user.isDay1User,
        longestStreak: user.longestStreak,
        daysActive: user.daysActive,
        transactionHistory: user.transactionHistory as any,
      },
    }));

    // Calculate scores for all users
    const usersWithScores = usersWithMetrics.map((user) => ({
      walletAddress: user.walletAddress,
      metrics: user.metrics,
      scores: calculateComponentScores(
        user.metrics,
        usersWithMetrics.map((u) => u.metrics)
      ),
    }));

    // Generate leaderboard with rankings
    const leaderboard = generateLeaderboard(usersWithScores);

    // Update all users with new scores and rankings
    const updatePromises = leaderboard
      .map((entry, index) => {
        const user = users.find((u) => u.walletAddress === entry.walletAddress);
        if (!user) return null;

        return prisma.user.update({
          where: { id: user.id },
          data: {
            volumeScore: entry.scores.volumeScore,
            gasScore: entry.scores.gasScore,
            transactionScore: entry.scores.transactionScore,
            nftScore: entry.scores.nftScore,
            daysActiveScore: entry.scores.daysActiveScore,
            streakScore: entry.scores.streakScore,
            day1BonusScore: entry.scores.day1BonusScore,
            totalScore: entry.scores.totalScore,
            rank: entry.rank,
            percentile: entry.percentile,
            updatedAt: new Date(),
          },
        });
      })
      .filter(Boolean);

    await Promise.all(updatePromises);

    console.log(`Successfully recalculated rankings for ${users.length} users`);

    return NextResponse.json({
      message: "Rankings recalculated successfully",
      totalUsers: users.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error recalculating rankings:", error);
    return NextResponse.json(
      { error: "Failed to recalculate rankings" },
      { status: 500 }
    );
  }
}
