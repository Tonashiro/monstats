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

import { useWalletStats } from "@/hooks/useWalletStats";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { AlertCircle, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { WalletStats } from "@/types";
import Image from "next/image";

/**
 * Main page component for the Monstats
 * @returns Main page component
 */
export default function HomePage() {
  const [submittedWalletAddress, setSubmittedWalletAddress] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useWalletStats(submittedWalletAddress, isSubmitted);

  // Type the error properly
  const typedError = error as { message: string } | null;

  // Ensure stats is properly typed
  const typedStats = stats as WalletStats | undefined;

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
            <Image
              src="/logo.webp"
              alt="Monstats"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Monstats
            </h1>
            <p className="text-xl text-white max-w-2xl mx-auto">
              Check your on-chain activity
            </p>
          </div>
        </div>

        {/* Input Section */}
        <div className="animate-slide-in" style={{ animationDelay: "0.2s" }}>
          <Card className="max-w-2xl mx-auto shadow-xl !border-white">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-semibold text-white">
                Check Your Wallet Stats
              </CardTitle>
              <p className="text-sm text-white">
                Enter your wallet address to see your personal statistics and
                ranking
              </p>
            </CardHeader>
            <CardContent className="flex justify-center px-8 py-6">
              <WalletInputForm onSubmit={handleSubmit} isLoading={isLoading} />
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {typedError && (
          <div className="animate-fade-in">
            <Card
              className={
                cn(
                  "max-w-2xl mx-auto",
                  typedError.message === "No transactions found for this wallet"
                    ? "border-blue-500/20 bg-blue-500/10"
                    : "border-red-500/20 bg-red-500/10"
                ) as string
              }
            >
              <CardContent className="pt-6">
                <div
                  className={cn(
                    "flex items-center space-x-2",
                    typedError.message ===
                      "No transactions found for this wallet"
                      ? "text-blue-400"
                      : "text-red-400"
                  )}
                >
                  {typedError.message ===
                  "No transactions found for this wallet" ? (
                    <Info className="h-5 w-5 text-blue-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <div>
                    <p className="font-medium">
                      {typedError.message ===
                      "No transactions found for this wallet"
                        ? "No Activity Found"
                        : "Error"}
                    </p>
                    <p className="text-sm">
                      {typedError.message ===
                      "No transactions found for this wallet"
                        ? "This wallet has no on-chain activity on Monad. Make sure you're using the correct wallet address and that you have performed transactions on the Monad blockchain."
                        : typedError.message}
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

        {/* User Stats Section - Only show when user submits wallet */}
        {typedStats && !isLoading && (
          <div className="space-y-6 animate-fade-in">
            <StatsDashboard stats={typedStats} />
          </div>
        )}

        {/* Leaderboard Section - Always Show */}
        <div
          className="space-y-6 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          <Leaderboard
            data={leaderboardData?.leaderboard || []}
            isLoading={leaderboardLoading}
            currentUserWallet={submittedWalletAddress}
          />

          {/* Admin Panel - Only show if there are users */}
          {leaderboardData && leaderboardData.pagination.totalUsers > 0 && (
            <AdminPanel />
          )}
        </div>

        {/* Info Section */}
        {!stats && !isLoading && !typedError && (
          <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-center">How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="space-y-2 group cursor-default">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto group-hover:bg-purple-500/30 transition-colors">
                      <span className="text-2xl">🏆</span>
                    </div>
                    <h3 className="font-semibold">View Leaderboard</h3>
                    <p className="text-sm text-white">
                      See the top Monad users ranked by their on-chain activity
                    </p>
                  </div>
                  <div className="space-y-2 group cursor-default">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto group-hover:bg-purple-500/30 transition-colors">
                      <span className="text-2xl">🔍</span>
                    </div>
                    <h3 className="font-semibold">Check Your Stats</h3>
                    <p className="text-sm text-white">
                      Enter your wallet to see your personal ranking and metrics
                    </p>
                  </div>
                  <div className="space-y-2 group cursor-default">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto group-hover:bg-purple-500/30 transition-colors">
                      <span className="text-2xl">📊</span>
                    </div>
                    <h3 className="font-semibold">Track Progress</h3>
                    <p className="text-sm text-white">
                      Monitor your on-chain activity and improve your ranking
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
