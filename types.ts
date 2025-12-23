
export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  volatility: number;
}

export interface PortfolioItem {
  symbol: string;
  quantity: number;
  avgCost: number;
}

export interface Transaction {
  id: string;
  type: 'BUY' | 'SELL' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'P2P_BUY' | 'P2P_SELL';
  symbol: string;
  price: number;
  quantity: number;
  timestamp: number;
}

export interface UserState {
  username: string;
  cash: number;
  holdings: PortfolioItem[];
  transactions: Transaction[];
  initialCash: number;
  isBanned?: boolean;
}

export interface Message {
  id: string;
  username: string;
  text: string;
  created_at: string;
}

export interface P2POrder {
  id: string;
  seller_id: string;
  seller_name: string;
  symbol: string;
  quantity: number;
  price: number;
  created_at: string;
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export interface NewsItem {
  id: string;
  title: string;
  type: 'INFO' | 'BULLISH' | 'BEARISH';
  timestamp: number;
}
