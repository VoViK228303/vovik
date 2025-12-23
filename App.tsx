
import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Moon, Sun, PauseCircle, PlayCircle, LogOut, User as UserIcon, ShieldAlert, Dices, Trophy, ShoppingCart, MessageSquare, Network, Bell, Wifi, WifiOff } from 'lucide-react';
import { Stock, UserState, Theme, NewsItem } from './types.ts';
import { INITIAL_STOCKS, INITIAL_NEWS } from './constants.ts';
import { StockTable } from './components/StockTable.tsx';
import { TradingPanel } from './components/TradingPanel.tsx';
import { PortfolioSummary } from './components/PortfolioSummary.tsx';
import { AIAnalyst } from './components/AIAnalyst.tsx';
import { Auth } from './components/Auth.tsx';
import { Profile } from './components/Profile.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { NewsFeed } from './components/NewsFeed.tsx';
import { PortfolioDistribution } from './components/PortfolioDistribution.tsx';
import { Casino } from './components/Casino.tsx';
import { Leaderboard } from './components/Leaderboard.tsx';
import { P2PMarket } from './components/P2PMarket.tsx';
import { GlobalChat } from './components/GlobalChat.tsx';
import { supabase, isSupabaseConfigured } from './lib/supabase.ts';

const checkIsAdmin = (username: string) => {
  const admins = ['Armen_LEV', 'admin'];
  return admins.includes(username);
};

export default function App() {
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  const [isMarketOpen, setIsMarketOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserState | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showCasino, setShowCasino] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showP2P, setShowP2P] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'chat' | 'p2p'} | null>(null);
  
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [news, setNews] = useState<NewsItem[]>(INITIAL_NEWS);
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string | null>(INITIAL_STOCKS[0].symbol);

  const selectedStock = stocks.find(s => s.symbol === selectedStockSymbol) || null;
  const isAdmin = currentUser ? checkIsAdmin(currentUser.username) : false;
  
  const currentEquity = currentUser ? currentUser.holdings.reduce((acc, item) => {
    const stock = stocks.find(s => s.symbol === item.symbol);
    return acc + (item.quantity * (stock?.price || 0));
  }, 0) : 0;

  const refreshUserData = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      const { data: holdings } = await supabase.from('holdings').select('*').eq('user_id', session.user.id);

      if (profile) {
        if (profile.is_banned) {
          await supabase.auth.signOut();
          setCurrentUser(null);
          alert('Ваш аккаунт был заблокирован администратором.');
          return;
        }
        setCurrentUser({
          username: profile.username,
          cash: profile.cash,
          initialCash: profile.initial_cash,
          holdings: holdings || [],
          transactions: [],
          isBanned: profile.is_banned
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    refreshUserData();

    const networkChannel = supabase.channel('global-sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new.username !== currentUser?.username) {
           setNotification({ msg: `Чат: ${payload.new.username} написал сообщение`, type: 'chat' });
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'p2p_market' }, (payload) => {
        if (payload.new.seller_name !== currentUser?.username) {
           setNotification({ msg: `Маркет: ${payload.new.seller_name} выставил лот!`, type: 'p2p' });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        supabase.auth.getSession().then(({data}) => {
          if (payload.new.id === data.session?.user?.id) refreshUserData();
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(networkChannel); };
  }, [currentUser?.username, refreshUserData]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (theme === Theme.DARK) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // Market Simulation
  useEffect(() => {
    if (!isMarketOpen) return;
    const interval = setInterval(() => {
      setStocks(currentStocks => 
        currentStocks.map(stock => {
          const volatility = stock.volatility !== undefined ? stock.volatility : 0.005;
          const change = stock.price * (Math.random() * volatility * 2 - volatility);
          const newPrice = Math.max(0.01, stock.price + change);
          return {
            ...stock,
            price: newPrice,
            change: newPrice - (stock.price - stock.change),
            changePercent: ((newPrice - (stock.price / (1 + stock.changePercent/100))) / (stock.price / (1 + stock.changePercent/100))) * 100
          };
        })
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [isMarketOpen]);

  const handleTrade = async (type: 'BUY' | 'SELL', quantity: number) => {
    if (!selectedStock || !currentUser || !isSupabaseConfigured) return;
    const { data: { session } } = await supabase.auth.getSession();
    const cost = quantity * selectedStock.price;

    if (type === 'BUY') {
      if (currentUser.cash < cost) return;
      const existing = currentUser.holdings.find(h => h.symbol === selectedStock.symbol);
      await supabase.from('holdings').upsert({ 
        user_id: session?.user.id, 
        symbol: selectedStock.symbol, 
        quantity: (existing?.quantity || 0) + quantity,
        avg_cost: selectedStock.price
      }, { onConflict: 'user_id,symbol' });
      await supabase.from('profiles').update({ cash: currentUser.cash - cost }).eq('id', session?.user.id);
    } else {
      const existing = currentUser.holdings.find(h => h.symbol === selectedStock.symbol);
      if (!existing || existing.quantity < quantity) return;
      const newQty = existing.quantity - quantity;
      if (newQty === 0) {
        await supabase.from('holdings').delete().match({ user_id: session?.user.id, symbol: selectedStock.symbol });
      } else {
        await supabase.from('holdings').update({ quantity: newQty }).match({ user_id: session?.user.id, symbol: selectedStock.symbol });
      }
      await supabase.from('profiles').update({ cash: currentUser.cash + cost }).eq('id', session?.user.id);
    }
    refreshUserData();
  };

  const handleTransfer = async (recipientUsername: string, amount: number): Promise<{ success: boolean, message: string }> => {
    if (!currentUser || !isSupabaseConfigured) return { success: false, message: 'Сеть недоступна' };
    if (currentUser.cash < amount) return { success: false, message: 'Недостаточно средств' };
    const { data: recipientProfile } = await supabase.from('profiles').select('id, cash').eq('username', recipientUsername).single();
    if (!recipientProfile) return { success: false, message: 'Пользователь не найден' };
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from('profiles').update({ cash: currentUser.cash - amount }).eq('id', session?.user.id);
    await supabase.from('profiles').update({ cash: recipientProfile.cash + amount }).eq('id', recipientProfile.id);
    refreshUserData();
    return { success: true, message: 'Успешно переведено!' };
  };

  if (!currentUser) return <Auth onLogin={setCurrentUser} />;

  return (
    <div className="min-h-screen pb-20 dark:bg-black bg-gray-50 transition-colors duration-500">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-[60] animate-in slide-in-from-right-full duration-300">
           <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-bold ${notification.type === 'chat' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-indigo-600 border-indigo-500 text-white'}`}>
             <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                {notification.type === 'chat' ? <MessageSquare size={16}/> : <ShoppingCart size={16}/>}
             </div>
             {notification.msg}
           </div>
        </div>
      )}

      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:rotate-12 transition-transform">
              <Network size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black italic tracking-tighter dark:text-white flex items-center gap-1">
                TRADESIM <span className="text-blue-600">PRO</span>
              </h1>
              <div className="flex items-center gap-1.5">
                 {isSupabaseConfigured ? (
                   <>
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Cloud Connected</span>
                   </>
                 ) : (
                   <>
                     <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                     <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Local Mode (No Sync)</span>
                   </>
                 )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
                onClick={() => setShowP2P(true)}
                className="p-2.5 bg-gray-100 dark:bg-gray-800 text-indigo-500 rounded-xl hover:scale-110 transition-all relative group"
              >
                <ShoppingCart size={20} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-[8px] text-white flex items-center justify-center rounded-full font-bold">!</span>
              </button>
             <button 
                onClick={() => setShowChat(true)}
                className="p-2.5 bg-gray-100 dark:bg-gray-800 text-blue-500 rounded-xl hover:scale-110 transition-all group"
              >
                <MessageSquare size={20} />
              </button>
            <button 
              onClick={() => setTheme(theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT)}
              className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl hover:rotate-45 transition-all"
            >
              {theme === Theme.LIGHT ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button 
              onClick={() => setShowLeaderboard(true)}
              className="p-2.5 bg-gray-100 dark:bg-gray-800 text-yellow-500 rounded-xl hover:scale-110 transition-all"
            >
              <Trophy size={20} />
            </button>
            <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1" />
            <button 
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 pl-2 pr-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 transition-colors"
            >
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-bold text-blue-700 dark:text-blue-300 hidden sm:block">{currentUser.username}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <PortfolioSummary userState={currentUser} currentEquity={currentEquity} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <StockTable stocks={stocks} onSelectStock={(s) => setSelectedStockSymbol(s.symbol)} selectedStockSymbol={selectedStockSymbol || undefined} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <PortfolioDistribution holdings={currentUser.holdings} stocks={stocks} cash={currentUser.cash} />
               <NewsFeed news={news} />
            </div>
          </div>
          <div className="lg:col-span-4">
            <TradingPanel selectedStock={selectedStock} maxAffordable={Math.floor(currentUser.cash / (selectedStock?.price || 1))} maxSellable={currentUser.holdings.find(h => h.symbol === selectedStockSymbol)?.quantity || 0} onTrade={handleTrade} isMarketOpen={isMarketOpen} />
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 left-6 flex gap-3 z-50">
        <button onClick={() => setShowCasino(true)} className="w-14 h-14 bg-yellow-500 text-white rounded-2xl shadow-xl hover:scale-110 transition-all flex items-center justify-center border-4 border-white/20"><Dices size={28} /></button>
        {isAdmin && <button onClick={() => setShowAdminPanel(true)} className="w-14 h-14 bg-red-600 text-white rounded-2xl shadow-xl hover:scale-110 transition-all flex items-center justify-center border-4 border-white/20"><ShieldAlert size={28} /></button>}
      </div>

      <AIAnalyst stocks={stocks} holdings={currentUser.holdings} totalEquity={currentUser.cash + currentEquity} />

      {showProfile && <Profile user={currentUser} onClose={() => setShowProfile(false)} onLogout={async () => { await supabase.auth.signOut(); setCurrentUser(null); }} onTransfer={handleTransfer} />}
      {showAdminPanel && <AdminPanel stocks={stocks} onClose={() => setShowAdminPanel(false)} onRefreshAll={refreshUserData} />}
      {showCasino && <Casino user={currentUser} onClose={() => setShowCasino(false)} onUpdateCash={async (amt) => {
          const newCash = currentUser.cash + amt;
          const { data: { session } } = await supabase.auth.getSession();
          if (session) await supabase.from('profiles').update({ cash: newCash }).eq('id', session.user.id);
          refreshUserData();
      }} />}
      {showLeaderboard && <Leaderboard stocks={stocks} currentUser={currentUser} onClose={() => setShowLeaderboard(false)} />}
      {showP2P && <P2PMarket user={currentUser} onClose={() => setShowP2P(false)} onRefreshUser={refreshUserData} />}
      {showChat && <GlobalChat username={currentUser.username} onClose={() => setShowChat(false)} />}
    </div>
  );
}
