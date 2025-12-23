import React, { useEffect, useRef, useState } from 'react';
import { Stock } from '../types.ts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface StockTableProps {
  stocks: Stock[];
  onSelectStock: (stock: Stock) => void;
  selectedStockSymbol?: string;
}

// Sub-component to handle individual row state and animation
const StockRow: React.FC<{ 
  stock: Stock; 
  isSelected: boolean; 
  onSelect: (stock: Stock) => void; 
}> = ({ stock, isSelected, onSelect }) => {
  const prevPriceRef = useRef(stock.price);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (stock.price > prevPriceRef.current) {
      setFlash('up');
    } else if (stock.price < prevPriceRef.current) {
      setFlash('down');
    }
    
    // Reset flash after animation
    const timer = setTimeout(() => {
      setFlash(null);
    }, 1000);

    prevPriceRef.current = stock.price;

    return () => clearTimeout(timer);
  }, [stock.price]);

  const isPositive = stock.change >= 0;

  // Determine background color based on selection and flash state
  let bgClass = "hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-500 cursor-pointer";
  if (isSelected) {
    bgClass += " bg-blue-50 dark:bg-blue-900/20";
  } else if (flash === 'up') {
    bgClass += " bg-emerald-50 dark:bg-emerald-900/10";
  } else if (flash === 'down') {
    bgClass += " bg-rose-50 dark:bg-rose-900/10";
  }

  // Determine text color for price based on flash
  let priceColorClass = "text-gray-900 dark:text-white transition-colors duration-500";
  if (flash === 'up') priceColorClass = "text-emerald-600 dark:text-emerald-400 font-bold";
  if (flash === 'down') priceColorClass = "text-rose-600 dark:text-rose-400 font-bold";

  return (
    <tr className={bgClass} onClick={() => onSelect(stock)}>
      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
        {stock.symbol}
      </td>
      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
        {stock.name}
      </td>
      <td className={`px-6 py-4 text-right font-medium ${priceColorClass}`}>
        {stock.price.toFixed(2)} ₽
      </td>
      <td className={`px-6 py-4 text-right font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        <div className="flex items-center justify-end gap-1">
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
        </div>
      </td>
      <td className="px-6 py-4 text-right text-gray-500 dark:text-gray-400 hidden md:table-cell">
        {(stock.volume / 1000000).toFixed(1)}M
      </td>
      <td className="px-6 py-4 text-center">
        <button 
          className={`
            p-2 rounded-full transition-all
            ${isSelected 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}
          `}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(stock);
          }}
        >
          <Activity size={18} />
        </button>
      </td>
    </tr>
  );
};

export const StockTable: React.FC<StockTableProps> = ({ stocks, onSelectStock, selectedStockSymbol }) => {
  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium">
          <tr>
            <th className="px-6 py-4">Symbol</th>
            <th className="px-6 py-4">Name</th>
            <th className="px-6 py-4 text-right">Price</th>
            <th className="px-6 py-4 text-right">Change</th>
            <th className="px-6 py-4 text-right hidden md:table-cell">Volume</th>
            <th className="px-6 py-4 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {stocks.map((stock) => (
            <StockRow 
              key={stock.symbol}
              stock={stock}
              isSelected={selectedStockSymbol === stock.symbol}
              onSelect={onSelectStock}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};