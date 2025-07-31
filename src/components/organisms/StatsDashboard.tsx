import * as React from "react";
import { Card } from "@/components/atoms/Card";
import { MetricCard } from "@/components/molecules/MetricCard";
import { TransactionChart } from "@/components/molecules/TransactionChart";
import { MetricCardSkeleton, ChartSkeleton } from "@/components/atoms/Skeleton";
import { WalletStats } from "@/types";
import { formatNumber, formatMON } from "@/lib/utils";
import { Flame, Fuel, Palette, DollarSign, Hash, Crown } from "lucide-react";

/**
 * StatsDashboard component props interface
 */
export interface StatsDashboardProps {
  /** Wallet statistics data */
  stats: WalletStats;
  /** Whether the dashboard is loading */
  isLoading?: boolean;
}

/**
 * StatsDashboard organism component for displaying wallet statistics
 * @param stats - Wallet statistics data
 * @param isLoading - Whether the dashboard is loading
 * @returns StatsDashboard component
 */
export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  stats,
  isLoading = false,
}) => {
  // No longer needed - using real transaction data from API

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse-slow">
              <MetricCardSkeleton />
            </Card>
          ))}
        </div>
        <Card>
          <ChartSkeleton />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Transactions"
          value={stats.txCount}
          description="All time transaction count"
          icon={<Hash className="h-4 w-4" />}
          variant="default"
        />

        <MetricCard
          title="Gas Spent"
          value={`${formatMON(stats.gasSpentMON)} MON`}
          description="You've burned MON in gas!"
          icon={<Fuel className="h-4 w-4" />}
          variant="warning"
        />

        <MetricCard
          title="Total Volume"
          value={`${formatMON(stats.totalVolume)} MON`}
          description="Total MON volume in transactions"
          icon={<DollarSign className="h-4 w-4" />}
          variant="success"
        />

        <MetricCard
          title="NFT Bag Value"
          value={`${formatNumber(stats.nftBagValue)} MON`}
          description="Your NFT bag is worth MON"
          icon={<Palette className="h-4 w-4" />}
          className="border-purple-200 bg-purple-700 text-white"
          variant="default"
        />

        <MetricCard
          title="Longest Streak"
          value={stats.longestStreak}
          description="Highest transaction streak"
          icon={<Flame className="h-4 w-4" />}
          variant="danger"
          highlight={stats.longestStreak >= 7}
        />

        <MetricCard
          title="Day 1 Status"
          value={stats.isDay1User ? "🎖 OG STATUS!" : "Not Day 1"}
          description={
            stats.isDay1User
              ? "You used Monad on Day 1!"
              : "Joined after launch"
          }
          icon={<Crown className="h-4 w-4" />}
          variant={stats.isDay1User ? "success" : "default"}
          highlight={stats.isDay1User}
        />
      </div>

      {/* Activity Chart */}
      <TransactionChart
        data={stats.transactionHistory || []}
        isLoading={isLoading}
      />
    </div>
  );
};
