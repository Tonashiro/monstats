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
  "1day": number | null;
  "7day": number | null;
  "30day": number | null;
}

/**
 * Magic Eden volume data
 */
export interface MagicEdenVolume {
  "1day": number;
  "7day": number;
  "30day": number;
  allTime: number;
}

/**
 * Magic Eden rank data
 */
export interface MagicEdenRank {
  "1day": number | null;
  "7day": number | null;
  "30day": number | null;
  allTime: number | null;
}

/**
 * Magic Eden volume change data
 */
export interface MagicEdenVolumeChange {
  "1day": number;
  "7day": number;
  "30day": number;
}

/**
 * Magic Eden floor ask price data
 */
export interface MagicEdenFloorAskPrice {
  currency: Record<string, unknown>; // Currency object
  amount: Record<string, unknown>; // Amount object
}

/**
 * Magic Eden NFT collection
 */
export interface MagicEdenCollection {
  collection: {
    id: string;
    slug: string | null;
    name: string;
    image: string;
    isSpam: boolean;
    banner: string | null;
    twitterUrl: string | null;
    discordUrl: string;
    externalUrl: string;
    twitterUsername: string;
    openseaVerificationStatus: string | null;
    description: string;
    metadataDisabled: boolean;
    sampleImages: string[];
    tokenCount: string; // Note: This is a string in the API response
    primaryContract: string;
    tokenSetId: string;
    floorAskPrice: MagicEdenFloorAskPrice;
    rank: MagicEdenRank;
    volume: MagicEdenVolume;
    volumeChange: MagicEdenVolumeChange;
    floorSale: MagicEdenFloorSale;
    contractKind: 'erc721' | 'erc1155'; // This is very useful for our validation!
  };
  ownership: {
    tokenCount: string; // Note: This is a string in the API response
    onSaleCount: string; // Note: This is a string in the API response
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
 