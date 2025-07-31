"use client";

import { useState } from "react";
import { MainLayout } from "@/components/templates/MainLayout";
import { WalletInputForm } from "@/components/molecules/WalletInputForm";
import { StatsDashboard } from "@/components/organisms/StatsDashboard";
import { Leaderboard } from "@/components/organisms/Leaderboard";
import { AdminPanel } from "@/components/molecules/AdminPanel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/atoms/Tabs";
import { useWalletStats } from "@/hooks/useWalletStats";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { AlertCircle, Loader2, Info, BarChart3, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Main page component for the Monad On-Chain Activity
 * @returns Main page component
 */
export default function HomePage() {
  const [submittedWalletAddress, setSubmittedWalletAddress] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<"stats" | "leaderboard">("stats");

  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useWalletStats(submittedWalletAddress, isSubmitted);

  const { data: leaderboardData, isLoading: leaderboardLoading } =
    useLeaderboard();

  const handleSubmit = (walletAddress: string) => {
    setSubmittedWalletAddress(walletAddress);
    setIsSubmitted(true);
    refetch();
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-8 animate-fade-in pt-8">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Monad On-Chain Activity
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Check your on-chain activity
            </p>
          </div>

          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Monad Blockchain • Live</span>
          </div>
        </div>

        {/* Input Section */}
        <div className="animate-slide-in" style={{ animationDelay: "0.2s" }}>
          <Card className="max-w-2xl mx-auto shadow-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-semibold">
                Enter Your Wallet Address
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center px-8 py-6">
              <WalletInputForm onSubmit={handleSubmit} isLoading={isLoading} />
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <div className="animate-fade-in">
            <Card
              className={cn(
                "max-w-2xl mx-auto",
                error.message === "No transactions found for this wallet"
                  ? "border-blue-500/20 bg-blue-500/10"
                  : "border-red-500/20 bg-red-500/10"
              )}
            >
              <CardContent className="pt-6">
                <div
                  className={cn(
                    "flex items-center space-x-2",
                    error.message === "No transactions found for this wallet"
                      ? "text-blue-400"
                      : "text-red-400"
                  )}
                >
                  {error.message === "No transactions found for this wallet" ? (
                    <Info className="h-5 w-5 text-blue-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <div>
                    <p className="font-medium">
                      {error.message === "No transactions found for this wallet"
                        ? "No Activity Found"
                        : "Error"}
                    </p>
                    <p className="text-sm">
                      {error.message === "No transactions found for this wallet"
                        ? "This wallet has no on-chain activity on Monad. Make sure you're using the correct wallet address and that you have performed transactions on the Monad blockchain."
                        : error.message}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="animate-fade-in">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                  <span>Fetching wallet statistics...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success State */}
        {stats && !isLoading && (
          <div className="space-y-6 animate-fade-in">
            {/* Tabs Navigation */}
            <div className="flex justify-center">
              <Tabs value={activeTab}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger
                    value="stats"
                    active={activeTab === "stats"}
                    onValueChange={(value) =>
                      setActiveTab(value as "stats" | "leaderboard")
                    }
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Your Stats
                  </TabsTrigger>
                  <TabsTrigger
                    value="leaderboard"
                    active={activeTab === "leaderboard"}
                    onValueChange={(value) =>
                      setActiveTab(value as "stats" | "leaderboard")
                    }
                    className="flex items-center gap-2"
                  >
                    <Trophy className="h-4 w-4" />
                    Leaderboard
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Tab Content */}
            <TabsContent value="stats" className="mt-0">
              <StatsDashboard stats={stats} />
            </TabsContent>

            <TabsContent value="leaderboard" className="mt-0">
              <div className="space-y-6">
                <Leaderboard
                  data={leaderboardData?.leaderboard || []}
                  isLoading={leaderboardLoading}
                  currentUserWallet={submittedWalletAddress}
                />

                {/* Admin Panel - Only show if there are users */}
                {leaderboardData && leaderboardData.totalUsers > 0 && (
                  <AdminPanel
                    totalUsers={leaderboardData.totalUsers}
                    lastUpdated={leaderboardData.lastUpdated}
                  />
                )}
              </div>
            </TabsContent>
          </div>
        )}

        {/* Info Section */}
        {!stats && !isLoading && !error && (
          <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-center">How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="space-y-2 group cursor-default">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto group-hover:bg-purple-500/30 transition-colors">
                      <span className="text-2xl">🔍</span>
                    </div>
                    <h3 className="font-semibold">Enter Wallet</h3>
                    <p className="text-sm text-muted-foreground">
                      Input your Monad wallet address to check eligibility
                    </p>
                  </div>
                  <div className="space-y-2 group cursor-default">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto group-hover:bg-purple-500/30 transition-colors">
                      <span className="text-2xl">📊</span>
                    </div>
                    <h3 className="font-semibold">Analyze Activity</h3>
                    <p className="text-sm text-muted-foreground">
                      We analyze your transaction history and on-chain metrics
                    </p>
                  </div>
                  <div className="space-y-2 group cursor-default">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto group-hover:bg-purple-500/30 transition-colors">
                      <span className="text-2xl">🎁</span>
                    </div>
                    <h3 className="font-semibold">View Results</h3>
                    <p className="text-sm text-muted-foreground">
                      See your on-chain activity and detailed activity breakdown
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
