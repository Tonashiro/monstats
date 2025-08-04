import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateComponentScores } from "@/lib/scoring";

/**
 * POST handler to recalculate all user scores with updated weights
 * This endpoint should be called after updating the scoring weights
 */
export async function POST(request: NextRequest) {
  try {
    // Get all users from database
    const allUsers = await prisma.user.findMany({
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
      },
    });

    if (allUsers.length === 0) {
      return NextResponse.json(
        { message: "No users found to recalculate" },
        { status: 404 }
      );
    }

    console.log(`Recalculating scores for ${allUsers.length} users...`);

    // Convert to UserMetrics format for scoring calculation
    const allUserMetrics = allUsers.map((user) => ({
      txCount: user.txCount,
      gasSpentMON: user.gasSpentMON,
      totalVolume: user.totalVolume,
      nftBagValue: user.nftBagValue,
      isDay1User: user.isDay1User,
      longestStreak: user.longestStreak,
      daysActive: user.daysActive,
    }));

    // Recalculate scores for each user
    const updatePromises = allUsers.map(async (user) => {
      const userMetrics = {
        txCount: user.txCount,
        gasSpentMON: user.gasSpentMON,
        totalVolume: user.totalVolume,
        nftBagValue: user.nftBagValue,
        isDay1User: user.isDay1User,
        longestStreak: user.longestStreak,
        daysActive: user.daysActive,
      };

      const scores = calculateComponentScores(userMetrics, allUserMetrics);

      // Update user with new scores
      return prisma.user.update({
        where: { id: user.id },
        data: {
          volumeScore: scores.volumeScore,
          gasScore: scores.gasScore,
          transactionScore: scores.transactionScore,
          nftScore: scores.nftScore,
          daysActiveScore: scores.daysActiveScore,
          streakScore: scores.streakScore,
          day1BonusScore: scores.day1BonusScore,
          totalScore: scores.totalScore,
        },
      });
    });

    // Execute all updates
    const updatedUsers = await Promise.all(updatePromises);

    console.log(`Successfully recalculated scores for ${updatedUsers.length} users`);

    return NextResponse.json({
      message: `Successfully recalculated scores for ${updatedUsers.length} users`,
      updatedCount: updatedUsers.length,
      newWeights: {
        volume: "25%",
        gas: "20%",
        transactions: "15%",
        nft: "20% (increased from 15%)",
        daysActive: "10%",
        streak: "5% (reduced from 10%)",
        day1Bonus: "5%",
      },
    });
  } catch (error) {
    console.error("Error recalculating scores:", error);
    return NextResponse.json(
      { error: "Failed to recalculate scores" },
      { status: 500 }
    );
  }
}

/**
 * GET handler to show current weight distribution
 */
export async function GET() {
  return NextResponse.json({
    message: "Score recalculation endpoint",
    usage: "POST to this endpoint to recalculate all user scores with updated weights",
    currentWeights: {
      volume: "25%",
      gas: "20%",
      transactions: "15%",
      nft: "20% (increased from 15%)",
      daysActive: "10%",
      streak: "5% (reduced from 10%)",
      day1Bonus: "5%",
    },
  });
} 