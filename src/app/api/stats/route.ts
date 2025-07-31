import { NextRequest, NextResponse } from "next/server";
import {
  WalletStats,
  EtherscanResponse,
  MagicEdenUserCollections,
  MagicEdenCollection,
  TransactionDataPoint,
} from "@/types";
import { isDay1, getLaunchDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import {
  calculateComponentScores,
  calculateDaysActive,
  generateLeaderboard,
} from "@/lib/scoring";

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
// NFT validation constants to prevent wash trading manipulation
const NFT_VALIDATION = {
  MIN_FLOOR_PRICE: 0.001, // Minimum floor price in MON (1 MON = 1000)
  MAX_HOLDINGS_MULTIPLIER: 1000, // Max holdings relative to typical collection size for ERC721
  MIN_TRADING_VOLUME: 0.01, // Minimum 7-day trading volume in MON
  SUSPICIOUS_HOLDINGS_THRESHOLD: 10000, // Flag holdings over 10k tokens
  MIN_COLLECTION_SIZE: 10, // Minimum collection size to be considered valid
  MAX_VALUE_PER_COLLECTION: 1000000, // Maximum value per collection to prevent manipulation
  // ERC1155 specific thresholds
  ERC1155_MAX_HOLDINGS: 100000, // Max holdings for ERC1155 (much higher since they're fungible)
  ERC1155_SUSPICIOUS_THRESHOLD: 10000, // Flag ERC1155 holdings over 10k tokens
} as const;

/**
 * Log suspicious NFT activity for monitoring
 */
function logSuspiciousNFTActivity(
  walletAddress: string,
  collectionName: string,
  reason: string,
  details: Record<string, unknown>
) {
  console.warn(`🚨 SUSPICIOUS NFT ACTIVITY DETECTED:`, {
    walletAddress,
    collectionName,
    reason,
    details,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Validate NFT collection data to prevent wash trading manipulation
 */
function validateNFTCollection(
  collection: MagicEdenCollection,
  sevenDayFloorSale: number,
  holdingItems: number,
  walletAddress: string
): { isValid: boolean; reason?: string; adjustedValue: number } {
  const collectionName = collection.collection.name || "Unknown";
  const rawValue = sevenDayFloorSale * holdingItems;

  // Detect if this is an ERC1155 collection
  const isERC1155 = collection.collection.contractKind === "erc1155";

  // Check 1: Minimum floor price
  if (sevenDayFloorSale < NFT_VALIDATION.MIN_FLOOR_PRICE) {
    logSuspiciousNFTActivity(
      walletAddress,
      collectionName,
      "Floor price too low",
      {
        floorPrice: sevenDayFloorSale,
        minimumRequired: NFT_VALIDATION.MIN_FLOOR_PRICE,
      }
    );
    return {
      isValid: false,
      reason: `Floor price too low: ${sevenDayFloorSale} MON`,
      adjustedValue: 0,
    };
  }

  // Check 2: Suspiciously large holdings (different thresholds for ERC1155 vs ERC721)
  const holdingsThreshold = isERC1155
    ? NFT_VALIDATION.ERC1155_SUSPICIOUS_THRESHOLD
    : NFT_VALIDATION.SUSPICIOUS_HOLDINGS_THRESHOLD;

  if (holdingItems > holdingsThreshold) {
    logSuspiciousNFTActivity(
      walletAddress,
      collectionName,
      "Suspiciously large holdings",
      {
        holdings: holdingItems,
        threshold: holdingsThreshold,
        isERC1155,
      }
    );
    return {
      isValid: false,
      reason: `Suspicious holdings: ${holdingItems.toLocaleString()} tokens`,
      adjustedValue: 0,
    };
  }
  // Check 3: Trading volume validation (if available)
  const sevenDayVolume = collection.collection.volume?.["7day"] || 0;
  if (
    sevenDayVolume > 0 &&
    sevenDayVolume < NFT_VALIDATION.MIN_TRADING_VOLUME
  ) {
    logSuspiciousNFTActivity(
      walletAddress,
      collectionName,
      "Low trading volume",
      {
        volume: sevenDayVolume,
        minimumRequired: NFT_VALIDATION.MIN_TRADING_VOLUME,
        isERC1155,
      }
    );
    return {
      isValid: false,
      reason: `Low trading volume: ${sevenDayVolume} MON`,
      adjustedValue: 0,
    };
  }

  // Check 4: Holdings vs collection size ratio (ERC721 only - skip for ERC1155)
  const collectionSize = Number(collection.collection.tokenCount) || 0;

  if (!isERC1155 && collectionSize > 0) {
    const holdingsRatio = holdingItems / collectionSize;
    if (holdingsRatio > NFT_VALIDATION.MAX_HOLDINGS_MULTIPLIER) {
      logSuspiciousNFTActivity(
        walletAddress,
        collectionName,
        "Holdings too large relative to collection",
        {
          holdings: holdingItems,
          collectionSize,
          ratio: holdingsRatio,
          maxAllowed: NFT_VALIDATION.MAX_HOLDINGS_MULTIPLIER,
          isERC1155,
        }
      );
      return {
        isValid: false,
        reason: `Holdings too large relative to collection: ${(
          holdingsRatio * 100
        ).toFixed(1)}%`,
        adjustedValue: 0,
      };
    }
  }

  // Check 5: Minimum collection size (skip for ERC1155 since they often have single token ID)
  if (
    !isERC1155 &&
    collectionSize > 0 &&
    collectionSize < NFT_VALIDATION.MIN_COLLECTION_SIZE
  ) {
    logSuspiciousNFTActivity(
      walletAddress,
      collectionName,
      "Collection too small",
      {
        collectionSize,
        minimumRequired: NFT_VALIDATION.MIN_COLLECTION_SIZE,
        isERC1155,
      }
    );
    return {
      isValid: false,
      reason: `Collection too small: ${collectionSize} tokens`,
      adjustedValue: 0,
    };
  }

  // Check 6: Maximum value per collection to prevent extreme manipulation
  if (rawValue > NFT_VALIDATION.MAX_VALUE_PER_COLLECTION) {
    logSuspiciousNFTActivity(
      walletAddress,
      collectionName,
      "Collection value too high",
      {
        rawValue,
        maximumAllowed: NFT_VALIDATION.MAX_VALUE_PER_COLLECTION,
        isERC1155,
      }
    );
    return {
      isValid: false,
      reason: `Collection value too high: ${rawValue.toLocaleString()} MON`,
      adjustedValue: 0,
    };
  }

  // All checks passed
  return {
    isValid: true,
    adjustedValue: rawValue,
  };
}

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

    // Calculate total NFT bag value with validation
    const totalValue =
      data.collections?.reduce((total, collection) => {
        const sevenDayFloorSale =
          collection.collection.floorSale?.["7day"] || 0;
        const holdingItems = Number(collection.ownership.tokenCount) || 1;

        // Validate the collection data
        const validation = validateNFTCollection(
          collection,
          sevenDayFloorSale,
          holdingItems,
          walletAddress
        );

        if (!validation.isValid) {
          console.warn(
            `NFT validation failed for ${collection.collection.name}: ${validation.reason}`
          );
          return total; // Skip this collection
        }

        return total + validation.adjustedValue;
      }, 0) || 0;

    // Final safety check: cap the total value to prevent extreme manipulation
    const maxTotalValue = 10000000; // 10M MON maximum
    if (totalValue > maxTotalValue) {
      console.warn(
        `🚨 NFT bag value capped for ${walletAddress}: ${totalValue} → ${maxTotalValue} MON`
      );
      return maxTotalValue;
    }

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
  const apiKey = process.env.ETHERSCAN_API_KEY;
  const chainId = "10143";

  if (!apiKey) {
    throw new Error("ETHERSCAN_API_KEY environment variable is not set");
  }

  const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=account&action=txlist&address=${walletAddress}&page=1&offset=10000&startblock=${startBlock}&endblock=99999999&sort=asc&apikey=${apiKey}`;

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
    const apiKey = process.env.ETHERSCAN_API_KEY;
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
 * Recalculate all user rankings
 */
async function recalculateAllRankings() {
  try {
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
      },
    });

    if (users.length === 0) return;

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
        transactionHistory: [], // Empty array since we don't store it anymore
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
      .map((entry) => {
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
            updatedAt: new Date(),
          },
        });
      })
      .filter(Boolean);

    await Promise.all(updatePromises);
    console.log(`✅ Rankings recalculated for ${users.length} users`);
  } catch (error) {
    console.error("❌ Error recalculating rankings:", error);
  }
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
        },
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
        },
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

      const scores = calculateComponentScores(
        currentUserMetrics,
        allUserMetrics
      );

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

      // Recalculate all rankings after adding/updating user
      await recalculateAllRankings();

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
