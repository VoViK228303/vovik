export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number; // Value amount
  changePercent: number; // Percentage
  volume: number;
  high: number;
  low: number;
  volatility: number; // Volatility factor (e.g., 0.02 for 2%)
}

export interface PortfolioItem {
  symbol: string;
  quantity: number;
  avgCost: number;
}

export interface Transaction {
  id: string;
  type: 'BUY' | 'SELL' | 'TRANSFER_OUT' | 'TRANSFER_IN';
  symbol: string; // For transfers, this might be 'CASH' or the other username
  price: number; // For transfers, 1
  quantity: number; // Amount
  timestamp: number;
}

export interface UserState {
  username: string;
  cash: number;
  holdings: PortfolioItem[];
  transactions: Transaction[];
  initialCash: number;
  isBanned?: boolean; // New field for ban status
}

export interface MarketState {
  isOpen: boolean;
  lastUpdate: number;
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export interface AIAnalysisResult {
  summary: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  advice: string;
}

export interface NewsItem {
  id: string;
  title: string;
  type: 'INFO' | 'BULLISH' | 'BEARISH';
  timestamp: number;
}