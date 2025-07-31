# Monad On-Chain Activity Checker & Leaderboard

A comprehensive web application for checking on-chain activity on the Monad blockchain with a sophisticated scoring system and leaderboard. Built with Next.js 15, TypeScript, and Tailwind CSS following atomic design principles.

## 🚀 Features

- **Wallet Analysis**: Enter any Ethereum wallet address to check eligibility
- **Comprehensive Metrics**: View total transactions, gas spent, volume, NFT bag value, and more
- **Advanced Scoring System**: Weighted scoring with percentile rankings
- **Real-time Leaderboard**: See how you rank against other users
- **Day 1 Status**: Special recognition for users who transacted on February 19, 2025
- **Transaction Streaks**: Track your longest consecutive transaction streak
- **Beautiful UI**: Modern, responsive design with gradient backgrounds and smooth animations
- **Real-time Data**: Uses React Query for efficient data fetching and caching
- **Database Integration**: PostgreSQL with Prisma ORM for persistent data

## 🏗 Architecture

This project follows **Atomic Design** principles:

### Atoms
- `Button` - Reusable button component with variants
- `Input` - Form input component
- `Card` - Card container with header, content, and footer variants

### Molecules
- `WalletInputForm` - Form for entering wallet addresses
- `MetricCard` - Display individual statistics with icons and styling

### Organisms
- `StatsDashboard` - Complete dashboard showing all wallet metrics and charts

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

## 📊 Metrics Tracked

- **Total Transactions**: All-time transaction count
- **Gas Spent**: Total MON tokens spent on gas fees
- **Total Volume**: Trading volume in USD
- **NFT Bag Value**: Estimated value of NFT holdings
- **Day 1 Status**: Whether user transacted on launch day
- **Longest Streak**: Highest consecutive transaction streak

## 🏆 Scoring System

The leaderboard uses a sophisticated weighted scoring system:

- **Total Volume (25%)**: Economic activity with log transformation to prevent whale dominance
- **Gas Spent (20%)**: Commitment and activity level
- **Transactions (15%)**: Consistent usage patterns
- **NFT Bag Value (15%)**: Investment and taste
- **Days Active (10%)**: Consistency over time
- **Transaction Streak (10%)**: Sustained engagement
- **Day 1 User Bonus (5%)**: Early adoption reward

Each metric is normalized to a 0-100 percentile scale, then weighted and combined for the final score.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Etherscan API key
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd monad-checker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/monad_checker"
   
   # API Keys
   ETHERSCAN_API_KEY="your_etherscan_api_key_here"
   
   # Environment
   NODE_ENV="development"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev --name init
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000) in your browser**

## 📁 Project Structure

```
src/
├── app/
│   ├── api/stats/[wallet]/route.ts  # API endpoint for wallet stats
│   ├── globals.css                  # Global styles and CSS variables
│   ├── layout.tsx                   # Root layout with providers
│   └── page.tsx                     # Main page component
├── components/
│   ├── atoms/                       # Basic UI components
│   ├── molecules/                   # Composite components
│   ├── organisms/                   # Complex components
│   └── templates/                   # Page layouts
├── hooks/
│   └── useWalletStats.ts           # Custom hook for data fetching
├── lib/
│   ├── providers.tsx               # React Query provider
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

Returns leaderboard data with rankings and scores.

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "walletAddress": "0x...",
      "totalScore": 85.2,
      "percentile": 99.5,
      "metrics": {...},
      "scores": {...}
    }
  ],
  "totalUsers": 1234,
  "lastUpdated": "2025-01-01T00:00:00Z"
}
```

### POST `/api/recalculate-rankings`

Recalculates all user rankings and scores (admin endpoint).

## 🎨 Design System

The application uses a consistent design system with:

- **Color Palette**: Purple and blue gradients for branding
- **Typography**: Geist Sans and Geist Mono fonts
- **Spacing**: Consistent spacing scale using Tailwind CSS
- **Components**: Reusable atomic components
- **Responsive**: Mobile-first responsive design

## 🔮 Future Enhancements

- [ ] Real Etherscan API integration
- [ ] Magic Eden API integration for NFT data
- [ ] Dark mode support
- [ ] Export functionality for wallet reports
- [ ] Historical data tracking
- [ ] Social sharing features

## 📝 Development

### Code Style

- Follow TypeScript best practices
- Use TSDoc comments for all components and functions
- Follow atomic design principles
- Use semantic HTML elements
- Implement proper error handling

### Testing

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built for the Monad community
- Inspired by modern web development practices
- Uses open-source libraries and tools
