
import React, { useState, useEffect, useCallback } from 'react';
import { Stock, UserState } from '../types.ts';
import { X, Trophy, Medal, User, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase.ts';

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
  const [rankings, setRankings] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGlobalRankings = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch all profiles
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, username, cash, initial_cash, is_banned');
      
      if (pError) throw pError;

      // 2. Fetch all holdings
      const { data: allHoldings, error: hError } = await supabase
        .from('holdings')
        .select('*');

      if (hError) throw hError;

      const calculatedRankings: RankedUser[] = profiles
        .filter(p => !p.is_banned)
        .map(profile => {
          const userHoldings = allHoldings?.filter(h => h.user_id === profile.id) || [];
          const portfolioValue = userHoldings.reduce((acc, item) => {
            const currentStock = stocks.find(s => s.symbol === item.symbol);
            return acc + (item.quantity * (currentStock?.price || 0));
          }, 0);

          const totalEquity = profile.cash + portfolioValue;
          const returnPercent = ((totalEquity - profile.initial_cash) / profile.initial_cash) * 100;

          return {
            username: profile.username,
            equity: totalEquity,
            returnPercent: returnPercent,
            isCurrentUser: profile.username === currentUser.username
          };
        });

      setRankings(calculatedRankings.sort((a, b) => b.equity - a.equity));
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [stocks, currentUser.username]);

  useEffect(() => {
    fetchGlobalRankings();
  }, [fetchGlobalRankings]);

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
    return baseStyle + "bg-white dark:bg-gray-900 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 flex justify-between items-center text-white shadow-xl z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <Trophy size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">Wall Street Elite</h2>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Global Ranking System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => fetchGlobalRankings(true)} 
              disabled={refreshing}
              className={`p-2 rounded-full hover:bg-white/10 transition-all ${refreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={20} />
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-all"><X size={24} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 dark:bg-black/40 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
               <Loader2 className="animate-spin text-blue-500" size={48} />
               <p className="text-xs font-black uppercase tracking-widest animate-pulse">Synchronizing Data...</p>
            </div>
          ) : rankings.length === 0 ? (
             <div className="text-center py-20">
                <div className="text-gray-300 dark:text-gray-700 mb-2 font-black text-4xl italic">EMPTY</div>
                <p className="text-gray-500 text-xs font-bold uppercase">No active investors found in the database</p>
             </div>
          ) : rankings.map((user, index) => (
            <div key={user.username} className={getRowStyle(index, user.isCurrentUser)}>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 shrink-0">{getRankIcon(index)}</div>
                <div className="flex items-center gap-3">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 ${user.isCurrentUser ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}>
                      {user.username.charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <div className="font-black text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
                        {user.username} 
                        {user.isCurrentUser && <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase">You</span>}
                     </div>
                     <div className={`text-[10px] font-black uppercase tracking-tighter ${user.returnPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {user.returnPercent >= 0 ? '▲' : '▼'} {Math.abs(user.returnPercent).toFixed(2)}% ROI
                     </div>
                   </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">
                  {user.equity.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs font-bold">₽</span>
                </div>
                <div className="text-[8px] text-gray-400 font-bold uppercase">Net Worth</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <div className="flex items-center gap-2 text-emerald-500">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-widest">Live Cloud Sync</span>
            </div>
            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
               Supabase Global Node
            </div>
        </div>
      </div>
    </div>
  );
};
