import React from 'react';
import { UserState } from '../types.ts';
import { Wallet, PieChart, TrendingUp, DollarSign } from 'lucide-react';

interface PortfolioSummaryProps {
  userState: UserState;
  currentEquity: number;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ userState, currentEquity }) => {
  const totalAssets = userState.cash + currentEquity;
  const totalReturn = totalAssets - userState.initialCash;
  const returnPercent = (totalReturn / userState.initialCash) * 100;
  const isPositive = totalReturn >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Total Assets */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-2">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
            <PieChart size={20} />
          </div>
          <span className="text-sm font-semibold uppercase tracking-wider">Всего активов</span>
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
        </div>
      </div>

      {/* Available Cash */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
         <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-2">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
            <Wallet size={20} />
          </div>
          <span className="text-sm font-semibold uppercase tracking-wider">Баланс (RUB)</span>
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {userState.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
        </div>
      </div>

      {/* Market Value */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
         <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-2">
          <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
            <DollarSign size={20} />
          </div>
          <span className="text-sm font-semibold uppercase tracking-wider">В акциях</span>
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
        </div>
      </div>

      {/* P/L */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
         <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-2">
          <div className={`p-2 rounded-lg ${isPositive ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'}`}>
            <TrendingUp size={20} className={isPositive ? '' : 'rotate-180'} />
          </div>
          <span className="text-sm font-semibold uppercase tracking-wider">Доход</span>
        </div>
        <div className={`text-2xl font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {isPositive ? '+' : ''}{totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
          <span className="text-sm ml-2 font-medium opacity-80">
             ({isPositive ? '+' : ''}{returnPercent.toFixed(2)}%)
          </span>
        </div>
      </div>
    </div>
  );
};