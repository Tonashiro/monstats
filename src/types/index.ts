/**
 * Transaction data point for charts
 */
export interface TransactionDataPoint {
  date: string;
  transactions: number;
  volume: number;
  gasSpent: number;
}

/**
 * Wallet statistics data structure
 */
export interface WalletStats {
  txCount: number;
  gasSpentMON: number;
  totalVolume: number;
  nftBagValue: number;
  isDay1User: boolean;
  longestStreak: number;
  transactionHistory: TransactionDataPoint[];
}

/**
 * Etherscan transaction response
 */
export interface EtherscanTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  timeStamp: string;
  blockNumber: string;
}

/**
 * Etherscan API response
 */
export interface EtherscanResponse {
  status: string;
  message: string;
  result: EtherscanTx[];
}

/**
 * Magic Eden floor sale data
 */
export interface MagicEdenFloorSale {
  "1day": number;
  "7day": number;
  "30day": number;
}

/**
 * Magic Eden NFT collection
 */
export interface MagicEdenCollection {
  collection: {
    symbol: string;
    name: string;
    floorPrice: number;
    listedCount: number;
    volumeAll: number;
    floorSale: MagicEdenFloorSale;
  };
  ownership: {
    tokenCount: number;
    onSaleCount: number;
  };
}

/**
 * Magic Eden user collections response
 */
export interface MagicEdenUserCollections {
  collections: MagicEdenCollection[];
}

/**
 * API error response
 */
export interface ApiError {
  error: string;
  message: string;
}
 