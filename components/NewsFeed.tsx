import React from 'react';
import { NewsItem } from '../types.ts';
import { Megaphone, TrendingUp, TrendingDown, Info } from 'lucide-react';

interface NewsFeedProps {
  news: NewsItem[];
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ news }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone size={20} className="text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Новости рынка</h2>
      </div>
      
      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[140px]">
        {news.length === 0 ? (
          <p className="text-gray-500 text-sm">Новостей пока нет.</p>
        ) : (
          news.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="mt-1 shrink-0">
                {item.type === 'BULLISH' && <TrendingUp size={16} className="text-emerald-500" />}
                {item.type === 'BEARISH' && <TrendingDown size={16} className="text-rose-500" />}
                {item.type === 'INFO' && <Info size={16} className="text-gray-400" />}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">{item.title}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};