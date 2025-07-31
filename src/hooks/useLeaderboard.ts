import { useQuery } from "@tanstack/react-query";
import { LeaderboardEntry } from "@/lib/scoring";

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalUsers: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  pagination: PaginationInfo;
  lastUpdated: string;
}

interface LeaderboardParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

async function fetchLeaderboard(params: LeaderboardParams = {}): Promise<LeaderboardResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.append("page", params.page.toString());
  if (params.pageSize) searchParams.append("pageSize", params.pageSize.toString());
  if (params.search) searchParams.append("search", params.search);

  const response = await fetch(`/api/leaderboard?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard");
  }

  return response.json();
}

export function useLeaderboard(params: LeaderboardParams = {}) {
  return useQuery({
    queryKey: ["leaderboard", params.page, params.pageSize, params.search],
    queryFn: () => fetchLeaderboard(params),
    staleTime: 30 * 1000, // 30 seconds - shorter for instant updates
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
} 