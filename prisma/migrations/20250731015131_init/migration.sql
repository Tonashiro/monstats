-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "txCount" INTEGER NOT NULL DEFAULT 0,
    "gasSpentMON" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalVolume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nftBagValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isDay1User" BOOLEAN NOT NULL DEFAULT false,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "daysActive" INTEGER NOT NULL DEFAULT 0,
    "volumeScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gasScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transactionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nftScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "daysActiveScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "streakScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "day1BonusScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "transactionHistory" JSONB,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "public"."users"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "users_rank_key" ON "public"."users"("rank");
