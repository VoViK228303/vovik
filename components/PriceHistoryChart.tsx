import React, { useMemo } from 'react';
import { Stock } from '../types.ts';

interface PriceHistoryChartProps {
  stock: Stock;
  color?: string;
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ stock, color }) => {
  // Generate simulated historical data based on current price
  // This ensures the chart looks related to the stock but remains static for the session unless simulated differently
  const dataPoints = useMemo(() => {
    const points = [];
    let currentPrice = stock.price;
    const days = 30;
    
    // Generate backwards from current price
    points.push(currentPrice);
    for (let i = 0; i < days; i++) {
      const change = currentPrice * (Math.random() * 0.04 - 0.02); // 2% daily volatility
      currentPrice -= change;
      points.push(currentPrice);
    }
    return points.reverse();
  }, [stock.symbol]); // Re-generate only when symbol changes

  const width = 100; // viewBox width
  const height = 50; // viewBox height
  const padding = 5;

  const maxPrice = Math.max(...dataPoints);
  const minPrice = Math.min(...dataPoints);
  const range = maxPrice - minPrice || 1;

  // Calculate coordinates
  const points = dataPoints.map((price, index) => {
    const x = (index / (dataPoints.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((price - minPrice) / range) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' ');

  // Create area path (line + close to bottom)
  const firstX = padding;
  const lastX = width - padding;
  const bottomY = height;
  const areaPath = `${points} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;

  const isPositive = stock.change >= 0;
  const strokeColor = isPositive ? '#10b981' : '#e11d48'; // emerald-500 : rose-600
  const fillColor = isPositive ? '#10b981' : '#e11d48';

  return (
    <div className="w-full h-48 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 mt-4 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">30 Day History</h3>
        <div className="flex gap-2 text-xs">
          <span className="text-gray-400">High: {maxPrice.toFixed(2)}</span>
          <span className="text-gray-400">Low: {minPrice.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="flex-1 w-full relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
          {/* Gradients */}
          <defs>
            <linearGradient id={`gradient-${stock.symbol}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={fillColor} stopOpacity="0.2" />
              <stop offset="100%" stopColor={fillColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area */}
          <path 
            d={areaPath} 
            fill={`url(#gradient-${stock.symbol})`} 
            stroke="none" 
          />

          {/* Line */}
          <polyline 
            fill="none" 
            stroke={strokeColor} 
            strokeWidth="1.5" 
            points={points} 
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      {/* Date Labels */}
      <div className="flex justify-between mt-2 text-[10px] text-gray-400">
        <span>30 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
};