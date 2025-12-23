import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Moon, Sun, PauseCircle, PlayCircle, LogOut, User as UserIcon, ShieldAlert, Dices, Trophy } from 'lucide-react';
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
import { supabase } from './lib/supabase.ts';

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
  
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [news, setNews] = useState<NewsItem[]>(INITIAL_NEWS);
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string | null>(INITIAL_STOCKS[0].symbol);
  const [showSettings, setShowSettings] = useState(false);

  const selectedStock = stocks.find(s => s.symbol === selectedStockSymbol) || null;
  const isAdmin = currentUser ? checkIsAdmin(currentUser.username) : false;
  
  const currentEquity = currentUser ? currentUser.holdings.reduce((acc, item) => {
    const stock = stocks.find(s => s.symbol === item.symbol);
    return acc + (item.quantity * (stock?.price || 0));
  }, 0) : 0;

  const getHoldingsForStock = (symbol: string) => {
    return currentUser?.holdings.find(h => h.symbol === symbol)?.quantity || 0;
  };

  // Sync user profile to Supabase
  const syncUserToDB = useCallback(async (user: UserState) => {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) return;

    // Update profiles table (cash)
    await supabase
      .from('profiles')
      .update({ cash: user.cash })
      .eq('id', authUser.user.id);

    // Update holdings table (Syncing holdings is more complex, usually we'd clear and re-insert or upsert)
    // For simplicity, we assume the backend handles transactions, but here we do a basic sync:
    for (const holding of user.holdings) {
      await supabase
        .from('holdings')
        .upsert({ 
          user_id: authUser.user.id, 
          symbol: holding.symbol, 
          quantity: holding.quantity, 
          avg_cost: holding.avgCost 
        }, { onConflict: 'user_id,symbol' });
    }
    
    // Remove holdings with 0 quantity from DB if any (basic cleanup)
    const activeSymbols = user.holdings.map(h => h.symbol);
    if (activeSymbols.length > 0) {
      await supabase
        .from('holdings')
        .delete()
        .eq('user_id', authUser.user.id)
        .not('symbol', 'in', `(${activeSymbols.join(',')})`);
    } else {
      await supabase
        .from('holdings')
        .delete()
        .eq('user_id', authUser.user.id);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const { data: holdings } = await supabase
          .from('holdings')
          .select('*')
          .eq('user_id', session.user.id);

        if (profile) {
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
    };
    checkSession();
  }, []);

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

  const handleLogin = (user: UserState) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setShowProfile(false);
    setShowAdminPanel(false);
    setShowCasino(false);
    setShowLeaderboard(false);
  };

  const handleCasinoUpdate = async (amount: number) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      cash: currentUser.cash + amount,
    };
    setCurrentUser(updatedUser);
    await syncUserToDB(updatedUser);
  };

  const handleTransfer = async (recipientUsername: string, amount: number): Promise<{ success: boolean, message: string }> => {
    if (!currentUser) return { success: false, message: 'Не авторизован' };
    if (currentUser.cash < amount) return { success: false, message: 'Недостаточно средств' };

    // Real DB Transfer
    const { data: recipientProfile, error: findError } = await supabase
      .from('profiles')
      .select('id, cash')
      .eq('username', recipientUsername)
      .single();

    if (findError || !recipientProfile) return { success: false, message: 'Пользователь не найден' };

    // 1. Deduct from sender
    const { error: deductError } = await supabase
      .from('profiles')
      .update({ cash: currentUser.cash - amount })
      .eq('username', currentUser.username);

    if (deductError) return { success: false, message: 'Ошибка при списании' };

    // 2. Add to recipient
    await supabase
      .from('profiles')
      .update({ cash: recipientProfile.cash + amount })
      .eq('id', recipientProfile.id);

    const updatedUser = { ...currentUser, cash: currentUser.cash - amount };
    setCurrentUser(updatedUser);
    
    return { success: true, message: 'Перевод выполнен успешно' };
  };

  const handleTrade = async (type: 'BUY' | 'SELL', quantity: number) => {
    if (!selectedStock || !currentUser) return;
    const cost = quantity * selectedStock.price;
    let updatedUser: UserState | null = null;

    if (type === 'BUY') {
      if (currentUser.cash < cost) return;
      const existing = currentUser.holdings.find(h => h.symbol === selectedStock.symbol);
      const newHoldings = existing 
        ? currentUser.holdings.map(h => h.symbol === selectedStock.symbol ? { ...h, quantity: h.quantity + quantity } : h)
        : [...currentUser.holdings, { symbol: selectedStock.symbol, quantity, avgCost: selectedStock.price }];
      
      updatedUser = {
        ...currentUser,
        cash: currentUser.cash - cost,
        holdings: newHoldings
      };
    } else {
      const currentQty = getHoldingsForStock(selectedStock.symbol);
      if (currentQty < quantity) return;
      const newHoldings = currentUser.holdings
        .map(h => h.symbol === selectedStock.symbol ? { ...h, quantity: h.quantity - quantity } : h)
        .filter(h => h.quantity > 0);
      
      updatedUser = {
        ...currentUser,
        cash: currentUser.cash + cost,
        holdings: newHoldings
      };
    }

    if (updatedUser) {
      setCurrentUser(updatedUser);
      await syncUserToDB(updatedUser);
    }
  };

  const handleManipulateStock = (symbol: string, percentChange: number) => {
    setStocks(prev => prev.map(s => {
      if (s.symbol === symbol) {
        const newPrice = s.price * (1 + percentChange / 100);
        return { ...s, price: newPrice, change: newPrice - (s.price - s.change), changePercent: percentChange + s.changePercent };
      }
      return s;
    }));
  };
  
  const handleUpdateVolatility = (symbol: string, volatility: number) => {
     setStocks(prev => prev.map(s => s.symbol === symbol ? { ...s, volatility } : s ));
  };

  const handleAddStock = (stock: Stock) => {
    if (stocks.length >= 15) return;
    setStocks(prev => [...prev, stock]);
  };

  const handleRemoveStock = (symbol: string) => {
    setStocks(prev => prev.filter(s => s.symbol !== symbol));
    if (selectedStockSymbol === symbol) setSelectedStockSymbol(null);
  };

  const handlePublishNews = (title: string, type: 'INFO' | 'BULLISH' | 'BEARISH') => {
    const newItem: NewsItem = { id: Date.now().toString(), title, type, timestamp: Date.now() };
    setNews(prev => [newItem, ...prev]);
  };

  if (!currentUser) return <Auth onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pb-20">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">T</div>
            <h1 className="text-xl font-bold tracking-tight">TradeSim <span className="text-blue-600 font-light">AI</span></h1>
          </div>
          <div className="flex items-center gap-4">
             {isAdmin && (
               <button onClick={() => setShowAdminPanel(true)} className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200" title="Админ Панель"><ShieldAlert size={20} /></button>
             )}
             <button onClick={() => setShowCasino(true)} className="p-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 rounded-full flex items-center gap-2 px-3" title="Казино"><Dices size={20} /><span className="hidden sm:inline font-bold text-xs uppercase">Casino</span></button>
             <button onClick={() => setShowLeaderboard(true)} className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center gap-2 px-3" title="Лидерборд"><Trophy size={20} /><span className="hidden sm:inline font-bold text-xs uppercase text-[10px]">Leaderboard</span></button>
             <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold ${isMarketOpen ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-800'}`}><span className={`w-2 h-2 rounded-full ${isMarketOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>{isMarketOpen ? 'LIVE' : 'CLOSED'}</div>
             <button onClick={() => setShowProfile(true)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300" title="Профиль"><UserIcon size={20} /></button>
             <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-gray-500 hover:text-gray-900 transition-colors"><Settings size={20} /></button>
          </div>
        </div>
      </header>

      {showSettings && (
        <div className="absolute top-16 right-4 sm:right-8 z-40 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 animate-in fade-in slide-in-from-top-2">
           <div className="space-y-2">
             <button onClick={() => setTheme(theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"><span className="flex items-center gap-2">{theme === Theme.LIGHT ? <Moon size={16} /> : <Sun size={16} />} {theme === Theme.LIGHT ? 'Тёмная тема' : 'Светлая тема'}</span></button>
             <button onClick={() => setIsMarketOpen(!isMarketOpen)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"><span className="flex items-center gap-2">{isMarketOpen ? <PauseCircle size={16} /> : <PlayCircle size={16} />} {isMarketOpen ? 'Пауза' : 'Возобновить'}</span></button>
             <div className="h-px bg-gray-100 dark:bg-gray-700 my-2"></div>
             <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors text-sm"><LogOut size={16} /> Выйти</button>
           </div>
        </div>
      )}

      {showProfile && <Profile user={currentUser} onClose={() => setShowProfile(false)} onLogout={handleLogout} onTransfer={handleTransfer} />}
      {showAdminPanel && isAdmin && <AdminPanel onClose={() => setShowAdminPanel(false)} stocks={stocks} onManipulateStock={handleManipulateStock} onUpdateVolatility={handleUpdateVolatility} onPublishNews={handlePublishNews} onAddStock={handleAddStock} onRemoveStock={handleRemoveStock} />}
      {showCasino && currentUser && <Casino onClose={() => setShowCasino(false)} user={currentUser} onUpdateCash={handleCasinoUpdate} />}
      {showLeaderboard && currentUser && <Leaderboard onClose={() => setShowLeaderboard(false)} stocks={stocks} currentUser={currentUser} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PortfolioSummary userState={currentUser} currentEquity={currentEquity} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
           <div className="lg:col-span-2 h-64"><NewsFeed news={news} /></div>
           <div className="lg:col-span-1 h-64"><PortfolioDistribution holdings={currentUser.holdings} stocks={stocks} cash={currentUser.cash} /></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
             <div className="flex justify-between items-center"><h2 className="text-lg font-bold text-gray-900 dark:text-white">Котировки</h2><span className="text-xs text-gray-500">Симуляция рынка РФ</span></div>
             <StockTable stocks={stocks} onSelectStock={(s) => setSelectedStockSymbol(s.symbol)} selectedStockSymbol={selectedStockSymbol || undefined} />
          </div>
          <div className="lg:col-span-1 h-[600px] lg:h-auto lg:sticky lg:top-24">
            <TradingPanel selectedStock={selectedStock} maxAffordable={selectedStock ? Math.floor(currentUser.cash / selectedStock.price) : 0} maxSellable={selectedStock ? getHoldingsForStock(selectedStock.symbol) : 0} onTrade={handleTrade} isMarketOpen={isMarketOpen} />
          </div>
        </div>
      </main>
      <AIAnalyst stocks={stocks} holdings={currentUser.holdings} totalEquity={currentEquity + currentUser.cash} />
    </div>
  );
}
