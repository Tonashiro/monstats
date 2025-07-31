import { useQuery } from "@tanstack/react-query";
import { LeaderboardEntry } from "@/lib/scoring";

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  totalUsers: number;
  lastUpdated: string;
}

async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  const response = await fetch("/api/leaderboard");
  
  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard");
  }

  return response.json();
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
} 