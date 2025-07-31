import { NextRequest, NextResponse } from "next/server";
import {
  WalletStats,
  EtherscanResponse,
  MagicEdenUserCollections,
  TransactionDataPoint,
} from "@/types";
import { isDay1, getLaunchDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { calculateComponentScores, calculateDaysActive, generateLeaderboard } from "@/lib/scoring";

/**
 * Calculate the longest consecutive days with transactions
 * @param transactions - Array of transaction timestamps
 * @returns Longest streak count in days
 */
function calculateLongestStreak(transactions: string[]): number {
  if (transactions.length === 0) return 0;

  const launchDate = getLaunchDate();

  // Convert timestamps to dates and get unique days, filtering out transactions before launch
  const uniqueDays = new Set<string>();
  transactions.forEach((timestamp) => {
    const timestampNum = parseInt(timestamp);

    // Skip transactions before Monad launch
    if (timestampNum < launchDate) {
      return;
    }

    const date = new Date(timestampNum * 1000);
    const dayString = date.toISOString().split("T")[0]; // YYYY-MM-DD format
    uniqueDays.add(dayString);
  });

  // Convert to sorted array of dates
  const sortedDays = Array.from(uniqueDays).sort();

  if (sortedDays.length === 0) return 0;
  if (sortedDays.length === 1) return 1;

  let currentStreak = 1;
  let longestStreak = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const prevDate = new Date(sortedDays[i - 1]);
    const currDate = new Date(sortedDays[i]);

    // Calculate difference in days
    const diffTime = currDate.getTime() - prevDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      // Consecutive days
      currentStreak++;
    } else {
      // Not consecutive, check if this was a longer streak
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      // Reset streak
      currentStreak = 1;
    }
  }

  // Check the final streak
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return longestStreak;
}

/**
 * Calculate total gas spent in MON
 * @param transactions - Array of transactions
 * @returns Total gas spent in MON
 */
function calculateGasSpent(transactions: Record<string, string>[]): number {
  const launchDate = getLaunchDate();

  return transactions.reduce((total, tx) => {
    const timestamp = parseInt(tx.timeStamp || "0");

    // Skip transactions before Monad launch
    if (timestamp < launchDate) {
      return total;
    }

    const gasUsed = parseInt(tx.gas || "0");
    const gasPrice = parseInt(tx.gasPrice || "0");
    const gasCost = (gasUsed * gasPrice) / 1e18; // Convert from wei to MON
    return total + gasCost;
  }, 0);
}

/**
 * Calculate total volume from transactions
 * @param transactions - Array of transactions
 * @returns Total volume in MON
 */
function calculateTotalVolume(transactions: Record<string, string>[]): number {
  const launchDate = getLaunchDate();

  return transactions.reduce((total, tx) => {
    const timestamp = parseInt(tx.timeStamp || "0");

    // Skip transactions before Monad launch
    if (timestamp < launchDate) {
      return total;
    }

    const value = parseInt(tx.value || "0") / 1e18; // Convert from wei to MON
    return total + value;
  }, 0);
}

/**
 * Fetch NFT bag value from Magic Eden
 * @param walletAddress - Wallet address to check
 * @returns NFT bag value in MON
 */
async function fetchNFTBagValue(walletAddress: string): Promise<number> {
  try {
    const baseUrl =
      process.env.MAGIC_EDEN_BASE_URL || "https://api-mainnet.magiceden.dev";
    const url = `${baseUrl}/v3/rtp/monad-testnet/users/${walletAddress}/collections/v3?includeTopBid=false&includeLiquidCount=false&offset=0&limit=100`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        `Magic Eden API error: ${response.status} ${response.statusText}`
      );
      return 0;
    }

    const data: MagicEdenUserCollections = await response.json();

    // Calculate total NFT bag value based on 7-day floor sale values
    const totalValue =
      data.collections?.reduce((total, collection) => {
        const sevenDayFloorSale =
          collection.collection.floorSale?.["7day"] || 0;
        const holdingItems = collection.ownership.tokenCount || 1;

        return total + sevenDayFloorSale * holdingItems;
      }, 0) || 0;

    return totalValue;
  } catch (error) {
    console.error("Error fetching NFT bag value:", error);
    return 0;
  }
}

/**
 * Fetch transactions from Etherscan using startblock pagination
 * @param walletAddress - Wallet address to fetch transactions for
 * @param startBlock - Starting block number (0 for first request)
 * @returns Array of transactions
 */
async function fetchTransactionsBatch(
  walletAddress: string,
  startBlock: number = 0,
  signal?: AbortSignal
): Promise<Record<string, string>[]> {
  const apiKey = process.env.ETHERSCAN_API_KEY || "R8A3776815X7N5D2V3QTHMXPI5IFJSZZMX";
  const chainId = "10143";

  if (!apiKey) {
    throw new Error("ETHERSCAN_API_KEY environment variable is not set");
  }

  const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=account&action=txlist&address=${walletAddress}&page=1&offset=10000&startblock=${startBlock}&endblock=99999999&sort=asc&apikey=${apiKey}`;

  console.log(`Fetching transactions from block ${startBlock}...`);

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check if request was cancelled
      if (signal?.aborted) {
        throw new Error("Request was cancelled");
      }

      console.log(`Attempt ${attempt}/${maxRetries} for block ${startBlock}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal, // Pass the abort signal
      });

      if (!response.ok) {
        throw new Error(
          `Etherscan API error: ${response.status} ${response.statusText}`
        );
      }

      const data: EtherscanResponse = await response.json();

      if (data.status !== "1") {
        // Check if this is a "No transactions found" error
        if (
          data.message &&
          (data.message.includes("No transactions found") ||
            data.message.includes("No records found") ||
            data.message.includes("No data found") ||
            data.message.toLowerCase().includes("no transactions"))
        ) {
          console.log(
            `Etherscan returned '${data.message}' - stopping retries`
          );
          return []; // Return empty array instead of throwing error
        }
        throw new Error(`Etherscan API error: ${data.message}`);
      }

      // Convert EtherscanTx[] to Record<string, string>[]
      return data.result.map((tx) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        gas: tx.gas,
        gasPrice: tx.gasPrice,
        timeStamp: tx.timeStamp,
        blockNumber: tx.blockNumber,
      }));
    } catch (error) {
      lastError = error as Error;

      // If request was cancelled, don't retry
      if (
        signal?.aborted ||
        (error instanceof Error && error.name === "AbortError")
      ) {
        console.log(`Request cancelled for block ${startBlock}`);
        throw error;
      }

      console.log(`Attempt ${attempt} failed for block ${startBlock}:`, error);

      // Check if this is a "No transactions found" error - don't retry
      if (
        lastError instanceof Error &&
        (lastError.message.includes("No transactions found") ||
          lastError.message.includes("No records found") ||
          lastError.message.includes("No data found") ||
          lastError.message.toLowerCase().includes("no transactions"))
      ) {
        console.log(`Stopping retries due to '${lastError.message}' error`);
        throw lastError;
      }

      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 1s, 2s, 4s, max 5s
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Unknown error occurred");
}

/**
 * Fetch all transactions from Etherscan using startblock pagination
 * @param walletAddress - Wallet address to fetch transactions for
 * @param signal - AbortSignal for request cancellation
 * @returns Array of all transactions
 */
async function fetchTransactions(
  walletAddress: string,
  signal?: AbortSignal
): Promise<Record<string, string>[]> {
  try {
    const apiKey =
      process.env.ETHERSCAN_API_KEY || "R8A3776815X7N5D2V3QTHMXPI5IFJSZZMX";
    if (!apiKey) {
      console.error("ETHERSCAN_API_KEY environment variable is not set");
      return [];
    }

    const allTransactions: Record<string, string>[] = [];
    let startBlock = 0;
    let batchCount = 0;
    const maxBatches = 100; // Increased limit for wallets with many transactions

    console.log(
      `Starting to fetch transactions using startblock pagination...`
    );

    while (batchCount < maxBatches) {
      try {
        batchCount++;
        console.log(
          `Fetching batch ${batchCount} starting from block ${startBlock}...`
        );

        const batchTransactions = await fetchTransactionsBatch(
          walletAddress,
          startBlock,
          signal
        );

        if (batchTransactions.length === 0) {
          if (batchCount === 1) {
            // If the first batch returns empty, it means no transactions found for this wallet
            console.log("No transactions found for this wallet address");
            return [];
          } else {
            // If subsequent batches return empty, we've reached the end
            console.log(`No more transactions found in batch ${batchCount}`);
            break;
          }
        }

        allTransactions.push(...batchTransactions);

        // If we got fewer than 10000 transactions, we've reached the end
        if (batchTransactions.length < 10000) {
          console.log(
            `Reached end of transactions (got ${batchTransactions.length} < 10000)`
          );
          break;
        }

        // Get the last transaction's block number and add 1 for the next startblock
        const lastTransaction = batchTransactions[batchTransactions.length - 1];
        startBlock = parseInt(lastTransaction.blockNumber) + 1;

        console.log(`Next startblock will be: ${startBlock}`);
      } catch (error) {
        console.error(`Error fetching batch ${batchCount}:`, error);

        // Check if this is a "No transactions found" error
        if (
          error instanceof Error &&
          (error.message.includes("No transactions found") ||
            error.message.includes("No records found") ||
            error.message.includes("No data found") ||
            error.message.toLowerCase().includes("no transactions"))
        ) {
          console.log(`Stopping due to '${error.message}' error`);
          return []; // Return empty array immediately
        }

        // For other errors, continue with what we have so far
        break;
      }
    }

    console.log(
      `Total transactions fetched: ${allTransactions.length} in ${batchCount} batches`
    );
    return allTransactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

/**
 * Generate transaction history data for charts
 * @param transactions - Array of transactions
 * @returns Array of transaction data points
 */
function generateTransactionHistory(
  transactions: Record<string, string>[]
): TransactionDataPoint[] {
  if (transactions.length === 0) return [];

  const launchDate = getLaunchDate();

  // Group transactions by date, filtering out transactions before launch
  const dailyData = new Map<
    string,
    { transactions: number; volume: number; gasSpent: number }
  >();

  transactions.forEach((tx) => {
    const timestamp = parseInt(tx.timeStamp);

    // Skip transactions before Monad launch
    if (timestamp < launchDate) {
      return;
    }

    const date = new Date(timestamp * 1000).toISOString().split("T")[0];
    const value = parseInt(tx.value || "0") / 1e18;
    const gasUsed = parseInt(tx.gas || "0");
    const gasPrice = parseInt(tx.gasPrice || "0");
    const gasCost = (gasUsed * gasPrice) / 1e18;

    if (dailyData.has(date)) {
      const existing = dailyData.get(date)!;
      existing.transactions += 1;
      existing.volume += value;
      existing.gasSpent += gasCost;
    } else {
      dailyData.set(date, {
        transactions: 1,
        volume: value,
        gasSpent: gasCost,
      });
    }
  });

  // Get the date range
  const dates = Array.from(dailyData.keys()).sort();
  if (dates.length === 0) return [];

  const startDate = new Date(dates[0]);
  const endDate = new Date(dates[dates.length - 1]);

  // Fill in missing dates with zero values
  const completeData: TransactionDataPoint[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateString = currentDate.toISOString().split("T")[0];
    const existingData = dailyData.get(dateString);

    completeData.push({
      date: dateString,
      transactions: existingData?.transactions || 0,
      volume: existingData?.volume || 0,
      gasSpent: existingData?.gasSpent || 0,
    });

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return completeData;
}

/**
 * GET handler for /api/stats?wallet={address}
 * @param request - Next.js request object
 * @returns Wallet statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    // Validate wallet address
    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    // Fetch transactions with request cancellation support
    const transactions = await fetchTransactions(wallet, request.signal);

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: "No transactions found for this wallet" },
        { status: 404 }
      );
    }

    const launchDate = getLaunchDate();

    // Filter transactions to only include those after launch
    const validTransactions = transactions.filter((tx) => {
      const timestamp = parseInt(tx.timeStamp || "0");
      return timestamp >= launchDate;
    });

    // Calculate metrics
    const txCount = validTransactions.length;
    const gasSpentMON = calculateGasSpent(transactions);
    const totalVolume = calculateTotalVolume(transactions);
    const nftBagValue = await fetchNFTBagValue(wallet);

    // Check if user is Day 1 (February 19, 2025)
    const isDay1User = validTransactions.some((tx) => {
      const txDate = new Date(parseInt(tx.timeStamp) * 1000);
      return isDay1(txDate);
    });

    const longestStreak = calculateLongestStreak(
      validTransactions.map((tx) => tx.timeStamp)
    );

    // Generate transaction history for charts
    const transactionHistory = generateTransactionHistory(validTransactions);

    const stats: WalletStats = {
      txCount,
      gasSpentMON,
      totalVolume,
      nftBagValue,
      isDay1User,
      longestStreak,
      transactionHistory,
    };

    // Calculate days active
    const daysActive = calculateDaysActive(transactionHistory);

    // Save or update user in database
    try {
      // Get all users for score calculation
      const allUsers = await prisma.user.findMany({
        select: {
          txCount: true,
          gasSpentMON: true,
          totalVolume: true,
          nftBagValue: true,
          isDay1User: true,
          longestStreak: true,
          daysActive: true,
        }
      });

      // Add current user metrics to the list for score calculation
      const allUserMetrics = [
        ...allUsers,
        {
          txCount,
          gasSpentMON,
          totalVolume,
          nftBagValue,
          isDay1User,
          longestStreak,
          daysActive,
        }
      ];

      // Calculate scores
      const currentUserMetrics = {
        txCount,
        gasSpentMON,
        totalVolume,
        nftBagValue,
        isDay1User,
        longestStreak,
        daysActive,
        transactionHistory,
      };

      const scores = calculateComponentScores(currentUserMetrics, allUserMetrics);

      // Upsert user data
      await prisma.user.upsert({
        where: { walletAddress: wallet },
        update: {
          txCount,
          gasSpentMON,
          totalVolume,
          nftBagValue,
          isDay1User,
          longestStreak,
          daysActive,
          transactionHistory,
          volumeScore: scores.volumeScore,
          gasScore: scores.gasScore,
          transactionScore: scores.transactionScore,
          nftScore: scores.nftScore,
          daysActiveScore: scores.daysActiveScore,
          streakScore: scores.streakScore,
          day1BonusScore: scores.day1BonusScore,
          totalScore: scores.totalScore,
          updatedAt: new Date(),
        },
        create: {
          walletAddress: wallet,
          txCount,
          gasSpentMON,
          totalVolume,
          nftBagValue,
          isDay1User,
          longestStreak,
          daysActive,
          transactionHistory,
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

      console.log(`User ${wallet} data saved/updated successfully`);
    } catch (dbError) {
      console.error("Database error:", dbError);
      // Continue with API response even if database save fails
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error processing wallet stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
