import React, { useMemo } from 'react';
import { Stock, UserState } from '../types.ts';
import { X, Trophy, Medal, TrendingUp, TrendingDown, User } from 'lucide-react';

interface LeaderboardProps {
  onClose: () => void;
  stocks: Stock[];
  currentUser: UserState;
}

interface RankedUser {
  username: string;
  equity: number;
  returnPercent: number;
  isCurrentUser: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onClose, stocks, currentUser }) => {
  
  const rankings: RankedUser[] = useMemo(() => {
    const usersStr = localStorage.getItem('tradeSimUsers');
    if (!usersStr) return [];

    const usersObj = JSON.parse(usersStr);
    const allUsers: any[] = Object.values(usersObj);

    // Filter out banned users and map to RankedUser format
    const ranked = allUsers
      .filter((u: any) => !u.state.isBanned)
      .map((u: any) => {
        const userState: UserState = u.state;
        
        // Calculate dynamic portfolio value based on current real-time stock prices
        const portfolioValue = userState.holdings.reduce((acc, item) => {
          const currentStock = stocks.find(s => s.symbol === item.symbol);
          return acc + (item.quantity * (currentStock?.price || 0));
        }, 0);

        const totalEquity = userState.cash + portfolioValue;
        const totalReturn = totalEquity - userState.initialCash;
        const returnPercent = (totalReturn / userState.initialCash) * 100;

        return {
          username: userState.username,
          equity: totalEquity,
          returnPercent: returnPercent,
          isCurrentUser: userState.username === currentUser.username
        };
      });

    // Sort by Total Equity Descending
    return ranked.sort((a, b) => b.equity - a.equity);
  }, [stocks, currentUser.username]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="text-yellow-500 fill-yellow-500" size={24} />;
    if (index === 1) return <Medal className="text-gray-400 fill-gray-400" size={24} />;
    if (index === 2) return <Medal className="text-amber-700 fill-amber-700" size={24} />;
    return <span className="text-gray-500 font-bold w-6 text-center">{index + 1}</span>;
  };

  const getRowStyle = (index: number, isCurrentUser: boolean) => {
    const baseStyle = "flex items-center justify-between p-4 rounded-xl transition-all border ";
    
    if (isCurrentUser) return baseStyle + "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-md transform scale-[1.02] z-10 my-1";
    if (index === 0) return baseStyle + "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/30";
    if (index === 1) return baseStyle + "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
    if (index === 2) return baseStyle + "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30";
    
    return baseStyle + "bg-white dark:bg-gray-900 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 flex justify-between items-center text-white shadow-lg z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Trophy size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-wide">Топ Инвесторов</h2>
              <p className="text-xs text-white/80 font-medium">Рейтинг по общей стоимости активов</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 dark:bg-black/20 custom-scrollbar">
          {rankings.map((user, index) => (
            <div key={user.username} className={getRowStyle(index, user.isCurrentUser)}>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 shrink-0">
                   {getRankIcon(index)}
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-sm shrink-0">
                      {index < 3 && user.username.startsWith('Armen') ? '🦁' : <User size={18}/>}
                   </div>
                   <div>
                     <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {user.username} 
                        {user.isCurrentUser && <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded font-semibold">ВЫ</span>}
                     </div>
                     <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        Доходность: 
                        <span className={`${user.returnPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'} font-medium flex items-center`}>
                           {user.returnPercent >= 0 ? '+' : ''}{user.returnPercent.toFixed(2)}%
                        </span>
                     </div>
                   </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {user.equity.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₽
                </div>
                <div className="text-xs text-gray-400">
                  Всего активов
                </div>
              </div>
            </div>
          ))}

          {rankings.length === 0 && (
             <div className="text-center py-10 text-gray-500">
                Список пользователей пуст
             </div>
          )}
        </div>
      </div>
    </div>
  );
};