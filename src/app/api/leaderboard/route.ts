import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type UserWithMetrics = {
  walletAddress: string;
  txCount: number;
  gasSpentMON: number;
  totalVolume: number;
  nftBagValue: number;
  isDay1User: boolean;
  longestStreak: number;
  daysActive: number;
  totalScore: number;
  volumeScore: number;
  gasScore: number;
  transactionScore: number;
  nftScore: number;
  daysActiveScore: number;
  streakScore: number;
  day1BonusScore: number;
};

// Define sort options
type SortField = 'totalScore' | 'totalVolume' | 'gasSpentMON' | 'txCount' | 'nftBagValue' | 'daysActive' | 'longestStreak';
type SortOrder = 'asc' | 'desc';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "100");
    const search = searchParams.get("search") || "";
    const sortBy = (searchParams.get("sortBy") || "totalScore") as SortField;
    const sortOrder = (searchParams.get("sortOrder") || "desc") as SortOrder;

    // Validate sort parameters
    const validSortFields: SortField[] = ['totalScore', 'totalVolume', 'gasSpentMON', 'txCount', 'nftBagValue', 'daysActive', 'longestStreak'];
    const validSortOrders: SortOrder[] = ['asc', 'desc'];
    
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        { error: "Invalid sort field" },
        { status: 400 }
      );
    }
    
    if (!validSortOrders.includes(sortOrder)) {
      return NextResponse.json(
        { error: "Invalid sort order" },
        { status: 400 }
      );
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Build where clause for search
    const whereClause = search
      ? {
          walletAddress: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {};

    // Get total count for pagination
    const totalUsers = await prisma.user.count({
      where: whereClause,
    });

    // Get paginated users with their metrics, sorted dynamically
    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take,
      select: {
        walletAddress: true,
        txCount: true,
        gasSpentMON: true,
        totalVolume: true,
        nftBagValue: true,
        isDay1User: true,
        longestStreak: true,
        daysActive: true,
        totalScore: true,
        volumeScore: true,
        gasScore: true,
        transactionScore: true,
        nftScore: true,
        daysActiveScore: true,
        streakScore: true,
        day1BonusScore: true,
      },
    });

    // Calculate user numbers (position in the current page)
    const leaderboard = users.map((user: UserWithMetrics, index: number) => ({
      walletAddress: user.walletAddress,
      userNumber: skip + index + 1, // This is the position number for display
      totalScore: user.totalScore,
      metrics: {
        txCount: user.txCount,
        gasSpentMON: user.gasSpentMON,
        totalVolume: user.totalVolume,
        nftBagValue: user.nftBagValue,
        isDay1User: user.isDay1User,
        longestStreak: user.longestStreak,
        daysActive: user.daysActive,
        transactionHistory: [], // Empty array since we don't store it anymore
      },
      scores: {
        volumeScore: user.volumeScore,
        gasScore: user.gasScore,
        transactionScore: user.transactionScore,
        nftScore: user.nftScore,
        daysActiveScore: user.daysActiveScore,
        streakScore: user.streakScore,
        day1BonusScore: user.day1BonusScore,
        totalScore: user.totalScore,
      },
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      leaderboard,
      pagination: {
        currentPage: page,
        pageSize,
        totalUsers,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
      sorting: {
        sortBy,
        sortOrder,
      },
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
