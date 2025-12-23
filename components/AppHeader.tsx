import React, { useState, useEffect } from 'react';
import { UserPortfolio, Stock, PortfolioItem } from '../types';

interface AppHeaderProps {
  portfolio: UserPortfolio;
  stocks: Stock[];
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  username: string;
  isAdmin: boolean;
  nextUpdateTimestamp: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ 
  portfolio, 
  stocks, 
  onOpenSettings, 
  onOpenProfile, 
  onOpenAdmin,
  username, 
  isAdmin,
  nextUpdateTimestamp
}) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = nextUpdateTimestamp - now;
      
      if (diff <= 0) {
        setTimeLeft('00:00');
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextUpdateTimestamp]);

  const holdingsValue = Object.entries(portfolio.holdings).reduce((total, [symbol, item]) => {
    const currentPrice = stocks.find(s => s.symbol === symbol)?.price || 0;
    return total + (currentPrice * (item as PortfolioItem).quantity);
  }, 0);

  const totalAssets = portfolio.cash + holdingsValue;
  const totalGain = totalAssets - portfolio.initialValue;
  const gainPercent = portfolio.initialValue > 0 ? (totalGain / portfolio.initialValue) * 100 : 0;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shrink-0">
               TS
             </div>
             <div>
               <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">TradeSim AI</h1>
               <div className="flex items-center gap-2">
                 <p className="text-xs text-gray-500 dark:text-gray-400">Next Update:</p>
                 <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                   {timeLeft}
                 </span>
               </div>
             </div>
          </div>

          <div className="flex-1 w-full md:w-auto overflow-x-auto no-scrollbar">
            <div className="flex items-center justify-between md:justify-center gap-6 min-w-max px-2">
              <StatCard label="Всего активов" value={`${totalAssets.toLocaleString('ru-RU', {minimumFractionDigits: 2})} ₽`} />
              <StatCard label="Доступно" value={`${portfolio.cash.toLocaleString('ru-RU', {minimumFractionDigits: 2})} ₽`} />
              <StatCard 
                label="P&L" 
                value={`${Math.abs(totalGain).toFixed(2)}₽ (${Math.abs(gainPercent).toFixed(2)}%)`} 
                trend={totalGain >= 0 ? 'up' : 'down'}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
               <button
                onClick={onOpenAdmin}
                className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-bold"
               >
                 Admin
               </button>
            )}

            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                {username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">{username}</span>
            </button>
            
            <button 
              onClick={onOpenSettings}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-gray-300"
              aria-label="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const StatCard = ({ label, value, trend }: { label: string, value: string, trend?: 'up' | 'down' }) => (
  <div className="flex flex-col">
    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
    <span className={`text-lg font-bold flex items-center gap-1 ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
      {trend === 'up' && <span className="text-xs">▲</span>}
      {trend === 'down' && <span className="text-xs">▼</span>}
      {value}
    </span>
  </div>
);