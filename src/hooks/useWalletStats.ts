import { useQuery } from "@tanstack/react-query";
import { WalletStats } from "@/types";

// Custom error type for API errors
interface ApiError extends Error {
  status?: number;
  originalMessage?: string;
}

/**
 * Fetch wallet statistics from the API
 * @param walletAddress - Wallet address to fetch stats for
 * @param signal - AbortSignal for request cancellation
 * @returns Promise resolving to wallet statistics
 */
async function fetchWalletStats(
  walletAddress: string, 
  signal?: AbortSignal
): Promise<WalletStats> {
  const response = await fetch(`/api/stats?wallet=${walletAddress}`, {
    signal,
  });

  if (!response.ok) {
    const error = await response.json();
    
    // Create a custom error that includes the status code and original error message
    const customError = new Error(error.error || error.message || "Failed to fetch wallet stats") as ApiError;
    customError.status = response.status;
    customError.originalMessage = error.error || error.message;
    
    throw customError;
  }

  return response.json();
}

/**
 * Custom hook for fetching wallet statistics
 * @param walletAddress - Wallet address to fetch stats for
 * @param enabled - Whether the query should be enabled
 * @returns Query result with wallet statistics
 */
export function useWalletStats(
  walletAddress: string,
  enabled: boolean = false
) {
  return useQuery({
    queryKey: ["walletStats", walletAddress],
    queryFn: ({ signal }) => fetchWalletStats(walletAddress, signal),
    enabled: enabled && walletAddress.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry if it's a "No transactions found" error (404)
      if ((error as ApiError).status === 404) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });
}
 