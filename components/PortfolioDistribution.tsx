import React from 'react';
import { PortfolioItem, Stock } from '../types.ts';
import { PieChart } from 'lucide-react';

interface PortfolioDistributionProps {
  holdings: PortfolioItem[];
  stocks: Stock[];
  cash: number;
}

export const PortfolioDistribution: React.FC<PortfolioDistributionProps> = ({ holdings, stocks, cash }) => {
  // Calculate value for each stock holding
  const stockData = holdings.map(h => {
    const stock = stocks.find(s => s.symbol === h.symbol);
    return {
      symbol: h.symbol,
      value: h.quantity * (stock?.price || 0),
      type: 'STOCK'
    };
  }).filter(d => d.value > 0);

  // Total Portfolio Value (Equity + Cash)
  const totalValue = stockData.reduce((acc, curr) => acc + curr.value, 0) + cash;

  // Prepare data with Cash included
  const data = [
    ...stockData.sort((a, b) => b.value - a.value),
    { symbol: 'RUB', value: cash, type: 'CASH' }
  ];

  // Palette
  const colors = [
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#F97316', // Orange
  ];

  // Assign colors and calculate percentages
  const items = data.map((item, index) => ({
    ...item,
    color: item.type === 'CASH' ? '#10B981' : colors[index % colors.length],
    percent: totalValue > 0 ? (item.value / totalValue) * 100 : 0
  }));

  // SVG Configuration
  const size = 160;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <PieChart size={20} className="text-purple-600 dark:text-purple-400" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Структура портфеля</h2>
      </div>

      <div className="flex flex-row items-center justify-around gap-6 flex-1">
        {/* SVG Chart */}
        <div className="relative w-36 h-36 shrink-0">
          <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 w-full h-full overflow-visible">
            {items.map((item) => {
              const dashArray = (item.percent / 100) * circumference;
              const dashOffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += item.percent;

              // Don't render tiny segments that break visuals
              if (item.percent < 0.5) return null;

              return (
                <circle
                  key={item.symbol}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashArray} ${circumference}`}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-700 ease-out hover:opacity-80 hover:stroke-[24px] cursor-pointer"
                >
                   <title>{item.symbol}: {item.percent.toFixed(1)}%</title>
                </circle>
              );
            })}
          </svg>
           {/* Center Label */}
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Активы</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {(totalValue / 1000).toFixed(1)}k
              </span>
           </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
          {items.map((item) => (
            <div key={item.symbol} className="flex items-center justify-between text-xs sm:text-sm group">
               <div className="flex items-center gap-2 overflow-hidden">
                 <span className="w-2.5 h-2.5 rounded-full shrink-0 group-hover:scale-125 transition-transform" style={{ backgroundColor: item.color }}></span>
                 <span className="font-medium text-gray-700 dark:text-gray-300 truncate" title={item.symbol}>{item.symbol}</span>
               </div>
               <div className="text-right shrink-0 ml-2">
                 <span className="font-bold text-gray-900 dark:text-white">{item.percent.toFixed(1)}%</span>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};