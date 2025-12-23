export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export enum OrderType {
  BUY = 'BUY',
  SELL = 'SELL'
}

export enum MarketStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export interface Transaction {
  id: string;
  type: OrderType;
  symbol: string;
  price: number;
  quantity: number;
  timestamp: string; // Changed to string for serialization stability
  username?: string; // Optional field for global logs to identify who made the trade
}

export interface PortfolioItem {
  quantity: number;
  avgPrice: number;
}

export interface UserPortfolio {
  cash: number;
  holdings: Record<string, PortfolioItem>;
  initialValue: number;
}

export interface User {
  username: string;
  password?: string; // Only used for auth checks, not passed around usually
  role: 'admin' | 'user'; 
  isBanned?: boolean; // Added ban status
  portfolio: UserPortfolio;
  transactions: Transaction[];
}