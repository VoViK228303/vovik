import React, { useState, useEffect, useRef } from 'react';
import { Stock } from '../types.ts';
import { DollarSign, Briefcase, RefreshCw } from 'lucide-react';
import { PriceHistoryChart } from './PriceHistoryChart.tsx';

interface TradingPanelProps {
  selectedStock: Stock | null;
  maxAffordable: number;
  maxSellable: number;
  onTrade: (type: 'BUY' | 'SELL', quantity: number) => void;
  isMarketOpen: boolean;
}

export const TradingPanel: React.FC<TradingPanelProps> = ({ 
  selectedStock, 
  maxAffordable, 
  maxSellable, 
  onTrade,
  isMarketOpen
}) => {
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState<string>('');
  const [tab, setTab] = useState<'BUY' | 'SELL'>('BUY');
  
  // Animation State
  const prevPriceRef = useRef(selectedStock?.price);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  // Reset quantity when stock changes
  useEffect(() => {
    setQuantity('');
    prevPriceRef.current = selectedStock?.price;
    setFlash(null);
  }, [selectedStock?.symbol]);

  // Handle Flash Animation
  useEffect(() => {
    if (!selectedStock) return;
    
    const prev = prevPriceRef.current;
    if (prev !== undefined) {
      if (selectedStock.price > prev) setFlash('up');
      else if (selectedStock.price < prev) setFlash('down');
    }
    
    prevPriceRef.current = selectedStock.price;

    const timer = setTimeout(() => setFlash(null), 800);
    return () => clearTimeout(timer);
  }, [selectedStock?.price]);

  if (!selectedStock) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-700 h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <Briefcase className="mb-4 h-12 w-12 opacity-20" />
        <p>Выберите акцию из списка для торговли.</p>
      </div>
    );
  }

  const qtyNum = parseInt(quantity) || 0;
  const estimatedTotal = qtyNum * selectedStock.price;
  const isValid = qtyNum > 0 && 
                  (tab === 'BUY' ? qtyNum <= maxAffordable : qtyNum <= maxSellable) &&
                  isMarketOpen;

  const handleTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onTrade(tab, qtyNum);
      setQuantity('');
    }
  };

  // Dynamic classes for price animation
  let priceColorClass = "text-gray-900 dark:text-white";
  if (flash === 'up') priceColorClass = "text-emerald-500 scale-110 transition-transform duration-300";
  if (flash === 'down') priceColorClass = "text-rose-500 scale-110 transition-transform duration-300";

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {selectedStock.symbol}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{selectedStock.name}</p>
            </div>
            <div className="text-right">
              <div className={`text-xl font-bold transition-all duration-300 ${priceColorClass}`}>
                {selectedStock.price.toFixed(2)} ₽
              </div>
              <div className={`text-sm font-medium ${selectedStock.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                 {selectedStock.change >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-700">
          <button 
            onClick={() => setTab('BUY')}
            className={`flex-1 py-4 font-semibold text-sm transition-colors ${tab === 'BUY' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            Купить
          </button>
          <button 
            onClick={() => setTab('SELL')}
            className={`flex-1 py-4 font-semibold text-sm transition-colors ${tab === 'SELL' ? 'text-rose-600 border-b-2 border-rose-500 bg-rose-50/50 dark:bg-rose-900/10' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            Продать
          </button>
        </div>

        {/* Form */}
        <div className="p-6 flex-1 flex flex-col justify-between">
          <form onSubmit={handleTrade} className="space-y-6">
            
            {/* Order Type Selector */}
            <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
              {['MARKET', 'LIMIT'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrderType(type as any)}
                  className={`
                    py-2 text-xs font-semibold rounded-md transition-all
                    ${orderType === type 
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}
                  `}
                >
                  {type === 'MARKET' ? 'РЫНОЧНЫЙ' : 'ЛИМИТНЫЙ'}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Количество</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-lg font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="0"
                  />
                  <div className="absolute right-3 top-3.5 text-xs text-gray-400 font-medium">ШТ</div>
                </div>
                
                {/* Stats under Input */}
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Доступно: <span className="font-medium text-gray-900 dark:text-gray-300">{tab === 'BUY' ? maxAffordable : maxSellable}</span></span>
                    <button 
                        type="button"
                        onClick={() => setQuantity((tab === 'BUY' ? Math.floor(maxAffordable) : maxSellable).toString())}
                        className="text-blue-500 hover:text-blue-600 font-medium"
                      >
                        Макс
                    </button>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>В портфеле:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-300">{maxSellable} шт.</span>
                  </div>
                </div>
              </div>

              {orderType === 'LIMIT' && (
                 <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Цена лимита</label>
                  <div className="relative">
                    <input
                      type="number"
                      disabled
                      value={selectedStock.price}
                      className="w-full bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg pl-4 pr-8 py-3 text-lg font-mono text-gray-500 cursor-not-allowed"
                    />
                    <div className="absolute right-3 top-3.5 text-xs text-orange-500 font-medium flex items-center gap-1">
                       ₽ <RefreshCw size={10}/>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
               <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">Итого (Примерно)</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                  </span>
               </div>

               <button
                type="submit"
                disabled={!isValid || !isMarketOpen}
                className={`
                  w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transform transition-all active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                  ${!isMarketOpen ? 'bg-gray-400' : tab === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200 dark:shadow-emerald-900/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-200 dark:shadow-rose-900/20'}
                `}
               >
                 {!isMarketOpen ? 'Биржа закрыта' : `${tab === 'BUY' ? 'Купить' : 'Продать'} ${selectedStock.symbol}`}
               </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Price History Chart */}
      <PriceHistoryChart stock={selectedStock} />
    </div>
  );
};