import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/Table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card";
import { Badge } from "@/components/atoms/Badge";
import { Input } from "@/components/atoms/Input";
import { Pagination } from "@/components/atoms/Pagination";
import { Button } from "@/components/atoms/Button";
import {
  Trophy,
  Medal,
  Award,
  Crown,
  TrendingUp,
  Users,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  LeaderboardEntry,
  formatWalletAddress,
  getScoreBreakdown,
} from "@/lib/scoring";
import { formatMON, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useLeaderboard } from "@/hooks/useLeaderboard";

export interface LeaderboardProps {
  data: LeaderboardEntry[];
  isLoading?: boolean;
  currentUserWallet?: string;
}

// Sort options configuration
const SORT_OPTIONS = [
  { value: "totalScore", label: "Score", defaultOrder: "desc" as const },
  { value: "totalVolume", label: "Volume", defaultOrder: "desc" as const },
  { value: "gasSpentMON", label: "Gas Spent", defaultOrder: "desc" as const },
  { value: "txCount", label: "Transactions", defaultOrder: "desc" as const },
  { value: "nftBagValue", label: "NFT Value", defaultOrder: "desc" as const },
  { value: "daysActive", label: "Days Active", defaultOrder: "desc" as const },
  { value: "longestStreak", label: "Streak", defaultOrder: "desc" as const },
] as const;

const getRankIcon = (userNumber: number) => {
  if (userNumber === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
  if (userNumber === 2) return <Medal className="h-4 w-4 text-gray-400" />;
  if (userNumber === 3) return <Award className="h-4 w-4 text-amber-600" />;
  return null;
};

const getRankBadgeVariant = (userNumber: number) => {
  if (userNumber === 1) return "default";
  if (userNumber === 2) return "secondary";
  if (userNumber === 3) return "outline";
  return "outline";
};

export const Leaderboard: React.FC<LeaderboardProps> = ({
  data,
  isLoading = false,
  currentUserWallet,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [sortBy, setSortBy] = React.useState("totalScore");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [showLoadingOverlay, setShowLoadingOverlay] = React.useState(false);

  // Use server-side pagination, search, and sorting
  const { data: leaderboardData, isLoading: leaderboardLoading } =
    useLeaderboard({
      page: currentPage,
      pageSize,
      search: searchQuery.trim() || undefined,
      sortBy,
      sortOrder,
    });

  // Reset to first page when search or sort changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, sortOrder]);

  // Handle loading overlay with timeout
  React.useEffect(() => {
    if (leaderboardLoading) {
      // Show loading overlay after a short delay
      const timer = setTimeout(() => {
        setShowLoadingOverlay(true);
      }, 1000); // 1000ms delay before showing loading overlay

      return () => {
        clearTimeout(timer);
        setShowLoadingOverlay(false);
      };
    } else {
      // Hide loading overlay immediately when loading stops
      setShowLoadingOverlay(false);
    }
  }, [leaderboardLoading]);

  const currentUser = data.find(
    (entry) =>
      entry.walletAddress.toLowerCase() === currentUserWallet?.toLowerCase()
  );

  // Use server-side data if available, otherwise fall back to client-side data
  // Keep showing previous data during loading to prevent disappearing
  const displayData = leaderboardData?.leaderboard || data;
  const pagination = leaderboardData?.pagination;
  const totalPages =
    pagination?.totalPages || Math.ceil(displayData.length / pageSize);
  const totalUsers = pagination?.totalUsers || displayData.length;

  // Handle sort change
  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      // Toggle order if same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new field with default order
      setSortBy(newSortBy);
      const defaultOrder =
        SORT_OPTIONS.find((option) => option.value === newSortBy)
          ?.defaultOrder || "desc";
      setSortOrder(defaultOrder);
    }
  };

  // Get current sort option
  const currentSortOption = SORT_OPTIONS.find(
    (option) => option.value === sortBy
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-purple-500" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                <div className="h-4 bg-muted rounded w-16 animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-purple-500" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Users Yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to check your wallet stats and appear on the
              leaderboard!
            </p>
            <p className="text-sm text-muted-foreground">
              Enter your wallet address above to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show no search results message
  if (searchQuery && displayData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-purple-500" />
              Leaderboard
              <Badge variant="outline" className="ml-2">
                <Users className="h-3 w-3 mr-1" />
                {data.length} users
              </Badge>
            </CardTitle>

            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by wallet address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground mb-4">
              No wallets found matching &quot;{searchQuery}&quot;
            </p>
            <p className="text-sm text-muted-foreground">
              Try a different search term or clear the search to see all users.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current User Summary */}
      {currentUser && (
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-400">
              <TrendingUp className="h-5 w-5" />
              Your Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  #{currentUser.userNumber}
                </div>
                <div className="text-sm text-muted-foreground">Position</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {currentUser.totalScore.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Total Score</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {data.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-500" />
                Leaderboard
                <Badge variant="outline" className="ml-2">
                  <Users className="h-3 w-3 mr-1" />
                  {totalUsers} users
                </Badge>
                {currentSortOption && (
                  <Badge variant="secondary" className="ml-2">
                    Sorted by {currentSortOption.label}{" "}
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </Badge>
                )}
              </CardTitle>

              {/* Search Input */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by wallet address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sort Controls */}
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={sortBy === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSortChange(option.value)}
                  className="flex items-center gap-1"
                >
                  {option.label}
                  {sortBy === option.value ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            {/* Loading overlay */}
            {showLoadingOverlay && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Updating...</span>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">Gas Spent</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">NFT Value</TableHead>
                  <TableHead className="text-right">Days Active</TableHead>
                  <TableHead className="text-right">Streak</TableHead>
                  <TableHead className="text-center">Day 1</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.map((entry) => {
                  const isCurrentUser =
                    currentUserWallet &&
                    entry.walletAddress.toLowerCase() ===
                      currentUserWallet.toLowerCase();

                  return (
                    <TableRow
                      key={entry.walletAddress}
                      className={cn(
                        isCurrentUser && "bg-purple-500/10 border-purple-500/20"
                      )}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={getRankBadgeVariant(entry.userNumber)}
                          >
                            #{entry.userNumber}
                          </Badge>
                          {getRankIcon(entry.userNumber)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatWalletAddress(entry.walletAddress)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {entry.totalScore.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMON(entry.metrics.totalVolume)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMON(entry.metrics.gasSpentMON)}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.metrics.txCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(entry.metrics.nftBagValue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.metrics.daysActive}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.metrics.longestStreak}
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.metrics.isDay1User ? (
                          <Crown className="h-4 w-4 text-yellow-500 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {displayData.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalUsers}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 75, 100]}
            />
          )}
        </CardContent>
      </Card>

      {/* Score Breakdown for Current User */}
      {currentUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Your Score Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {getScoreBreakdown(currentUser.scores).map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(item.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {item.score.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
