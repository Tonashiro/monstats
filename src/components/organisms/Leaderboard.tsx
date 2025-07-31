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
import { Trophy, Medal, Award, Crown, TrendingUp, Users } from "lucide-react";
import {
  LeaderboardEntry,
  formatWalletAddress,
  getScoreBreakdown,
} from "@/lib/scoring";
import { formatMON, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface LeaderboardProps {
  data: LeaderboardEntry[];
  isLoading?: boolean;
  currentUserWallet?: string;
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
  if (rank === 3) return <Award className="h-4 w-4 text-amber-600" />;
  return null;
};

const getRankBadgeVariant = (rank: number) => {
  if (rank === 1) return "default";
  if (rank === 2) return "secondary";
  if (rank === 3) return "outline";
  return "outline";
};

export const Leaderboard: React.FC<LeaderboardProps> = ({
  data,
  isLoading = false,
  currentUserWallet,
}) => {
  const currentUser = data.find(
    (entry) =>
      entry.walletAddress.toLowerCase() === currentUserWallet?.toLowerCase()
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  #{currentUser.rank}
                </div>
                <div className="text-sm text-muted-foreground">Rank</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {currentUser.totalScore.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Total Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  Top {currentUser.percentile.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Percentile</div>
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
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-purple-500" />
            Leaderboard
            <Badge variant="outline" className="ml-2">
              <Users className="h-3 w-3 mr-1" />
              {data.length} users
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Gas Spent</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">NFT Value</TableHead>
                <TableHead className="text-right">Days Active</TableHead>
                <TableHead className="text-right">Streak</TableHead>
                <TableHead className="text-center">Day 1</TableHead>
                <TableHead className="text-right">Percentile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((entry) => {
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
                        {getRankIcon(entry.rank)}
                        <Badge variant={getRankBadgeVariant(entry.rank)}>
                          #{entry.rank}
                        </Badge>
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
                    <TableCell className="text-right">
                      <Badge variant="outline">
                        Top {entry.percentile.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
