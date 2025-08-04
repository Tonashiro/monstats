# Monstats Checker & Leaderboard

A comprehensive web application for checking on-chain activity on the Monad blockchain with a sophisticated scoring system and dynamic leaderboard. Built with Next.js 15, TypeScript, and Tailwind CSS following atomic design principles.

## 🚀 Features

- **Wallet Analysis**: Enter any Ethereum wallet address to check eligibility
- **Comprehensive Metrics**: View total transactions, gas spent, volume, NFT bag value, and more
- **Advanced Scoring System**: Weighted scoring with percentile rankings
- **Dynamic Leaderboard**: Sort by any metric with real-time updates
- **Smart Loading**: Smooth loading states with timeout-based overlays
- **Day 1 Status**: Special recognition for users who transacted on February 19, 2025
- **Transaction Streaks**: Track your longest consecutive transaction streak
- **Beautiful UI**: Modern, responsive design with gradient backgrounds and smooth animations
- **Real-time Data**: Uses React Query for efficient data fetching and caching
- **Database Integration**: PostgreSQL with Prisma ORM for persistent data
- **Search & Pagination**: Find specific wallets and navigate through large datasets

## 🏗 Architecture

This project follows **Atomic Design** principles:

### Atoms
- `Button` - Reusable button component with variants
- `Input` - Form input component
- `Card` - Card container with header, content, and footer variants
- `Badge` - Status and label components
- `Table` - Data table components
- `Pagination` - Page navigation component

### Molecules
- `WalletInputForm` - Form for entering wallet addresses
- `MetricCard` - Display individual statistics with icons and styling
- `TransactionChart` - Chart component for transaction history
- `AdminPanel` - Administrative controls

### Organisms
- `StatsDashboard` - Complete dashboard showing all wallet metrics and charts
- `Leaderboard` - Dynamic leaderboard with sorting and search capabilities

### Templates
- `MainLayout` - Page layout with header, main content, and footer

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: React Query (TanStack Query)
- **UI Components**: Custom components with Radix UI primitives
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Design System**: Atomic Design methodology
- **Database**: PostgreSQL with Prisma ORM
- **External APIs**: Etherscan API, Magic Eden API

## 📊 Metrics Tracked

- **Total Transactions**: All-time transaction count
- **Gas Spent**: Total MON tokens spent on gas fees
- **Total Volume**: Trading volume in MON
- **NFT Bag Value**: Estimated value of NFT holdings from Magic Eden
- **Day 1 Status**: Whether user transacted on launch day (February 19, 2025)
- **Longest Streak**: Highest consecutive transaction streak
- **Days Active**: Number of unique days with transactions

## 🏆 Scoring System

The leaderboard uses a sophisticated weighted scoring system:

- **Total Volume (25%)**: Economic activity with log transformation to prevent whale dominance
- **Gas Spent (20%)**: Commitment and activity level
- **Transactions (15%)**: Consistent usage patterns
- **NFT Bag Value (20%)**: Investment and taste
- **Days Active (10%)**: Consistency over time
- **Transaction Streak (5%)**: Sustained engagement
- **Day 1 User Bonus (5%)**: Early adoption reward

Each metric is normalized to a 0-100 percentile scale, then weighted and combined for the final score.

## 🎯 Dynamic Sorting

The leaderboard features intelligent sorting capabilities:

- **Sort by Any Metric**: Score, Volume, Gas Spent, Transactions, NFT Value, Days Active, Streak
- **Ascending/Descending**: Toggle sort order for each field
- **Position Numbers**: Dynamic position numbers (#1, #2, etc.) instead of fixed ranks
- **Real-time Updates**: Instant sorting without page refreshes
- **Search Integration**: Search works seamlessly with any sort order
- **Pagination**: Navigate through sorted results efficiently


## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── leaderboard/route.ts     # Leaderboard API with sorting
│   │   └── stats/route.ts           # Wallet stats API
│   ├── globals.css                  # Global styles and CSS variables
│   ├── layout.tsx                   # Root layout with providers
│   └── page.tsx                     # Main page component
├── components/
│   ├── atoms/                       # Basic UI components
│   ├── molecules/                   # Composite components
│   ├── organisms/                   # Complex components
│   └── templates/                   # Page layouts
├── hooks/
│   ├── useLeaderboard.ts           # Custom hook for leaderboard data
│   └── useWalletStats.ts           # Custom hook for wallet stats
├── lib/
│   ├── prisma.ts                   # Database client
│   ├── providers.tsx               # React Query provider
│   ├── scoring.ts                  # Scoring algorithms
│   └── utils.ts                    # Utility functions
└── types/
    └── index.ts                    # TypeScript type definitions
```

## 🔧 API Endpoints

### GET `/api/stats?wallet=<address>`

Returns wallet statistics for the provided address and saves data to database.

**Response:**
```json
{
  "txCount": 182,
  "gasSpentMON": 3.42,
  "totalVolume": 4200.55,
  "nftBagValue": 321,
  "isDay1User": true,
  "longestStreak": 7,
  "transactionHistory": [...]
}
```

### GET `/api/leaderboard`

Returns leaderboard data with dynamic sorting and pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 100)
- `search`: Search by wallet address
- `sortBy`: Sort field (totalScore, totalVolume, gasSpentMON, etc.)
- `sortOrder`: Sort direction (asc, desc)

**Response:**
```json
{
  "leaderboard": [
    {
      "userNumber": 1,
      "walletAddress": "0x...",
      "totalScore": 85.2,
      "metrics": {...},
      "scores": {...}
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 100,
    "totalUsers": 1234,
    "totalPages": 13,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "sorting": {
    "sortBy": "totalScore",
    "sortOrder": "desc"
  },
  "lastUpdated": "2025-01-01T00:00:00Z"
}
```

## 🎨 Design System

The application uses a consistent design system with:

- **Color Palette**: Purple and blue gradients for branding
- **Typography**: Geist Sans and Geist Mono fonts
- **Spacing**: Consistent spacing scale using Tailwind CSS
- **Components**: Reusable atomic components
- **Responsive**: Mobile-first responsive design
- **Loading States**: Smooth loading overlays with timeout-based display
