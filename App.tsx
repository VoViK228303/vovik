import React, { useState, useEffect } from 'react';
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

// Utility to check admin credentials
const checkIsAdmin = (username: string) => {
  const admins = ['Armen_LEV', 'admin'];
  return admins.includes(username);
};

export default function App() {
  // --- State ---
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

  // --- Derived State ---
  const selectedStock = stocks.find(s => s.symbol === selectedStockSymbol) || null;
  const isAdmin = currentUser ? checkIsAdmin(currentUser.username) : false;
  
  const currentEquity = currentUser ? currentUser.holdings.reduce((acc, item) => {
    const stock = stocks.find(s => s.symbol === item.symbol);
    return acc + (item.quantity * (stock?.price || 0));
  }, 0) : 0;

  const getHoldingsForStock = (symbol: string) => {
    return currentUser?.holdings.find(h => h.symbol === symbol)?.quantity || 0;
  };

  // --- Effects ---

  // Initialize Session
  useEffect(() => {
    const sessionUser = localStorage.getItem('tradeSimCurrentUser');
    if (sessionUser) {
      const users = JSON.parse(localStorage.getItem('tradeSimUsers') || '{}');
      if (users[sessionUser]) {
        // Check ban status on reload
        if (users[sessionUser].state.isBanned) {
          localStorage.removeItem('tradeSimCurrentUser');
          setCurrentUser(null);
        } else {
          setCurrentUser(users[sessionUser].state);
        }
      }
    }
  }, []);

  // Theme Handling
  useEffect(() => {
    if (theme === Theme.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Market Simulation
  useEffect(() => {
    if (!isMarketOpen) return;

    const interval = setInterval(() => {
      setStocks(currentStocks => 
        currentStocks.map(stock => {
          // Use specific stock volatility or default
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
    }, 300000); // Update every 5 minutes (300,000 ms)

    return () => clearInterval(interval);
  }, [isMarketOpen]);

  // Persist Current User Data
  useEffect(() => {
    if (currentUser) {
      const users = JSON.parse(localStorage.getItem('tradeSimUsers') || '{}');
      if (users[currentUser.username]) {
        users[currentUser.username].state = currentUser;
        localStorage.setItem('tradeSimUsers', JSON.stringify(users));
      }
    }
  }, [currentUser]);

  // --- Handlers ---

  const handleLogin = (user: UserState) => {
    setCurrentUser(user);
    localStorage.setItem('tradeSimCurrentUser', user.username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tradeSimCurrentUser');
    setShowProfile(false);
    setShowAdminPanel(false);
    setShowCasino(false);
    setShowLeaderboard(false);
  };

  const handleCasinoUpdate = (amount: number) => {
    if (!currentUser) return;
    
    setCurrentUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        cash: prev.cash + amount,
        transactions: [...prev.transactions, {
          id: Date.now().toString(),
          type: amount >= 0 ? 'TRANSFER_IN' : 'TRANSFER_OUT',
          symbol: 'CASINO',
          price: 1,
          quantity: Math.abs(amount),
          timestamp: Date.now()
        }]
      };
    });
  };

  const handleTransfer = (recipientUsername: string, amount: number): { success: boolean, message: string } => {
    if (!currentUser) return { success: false, message: 'Не авторизован' };
    if (currentUser.cash < amount) return { success: false, message: 'Недостаточно средств' };
    if (recipientUsername === currentUser.username) return { success: false, message: 'Нельзя отправить себе' };

    const users = JSON.parse(localStorage.getItem('tradeSimUsers') || '{}');
    if (!users[recipientUsername]) return { success: false, message: 'Пользователь не найден' };

    setCurrentUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        cash: prev.cash - amount,
        transactions: [...prev.transactions, {
          id: Date.now().toString(),
          type: 'TRANSFER_OUT',
          symbol: recipientUsername,
          price: 1,
          quantity: amount,
          timestamp: Date.now()
        }]
      };
    });

    const recipientUser = users[recipientUsername];
    recipientUser.state.cash += amount;
    recipientUser.state.transactions.push({
      id: Date.now().toString() + '_in',
      type: 'TRANSFER_IN',
      symbol: currentUser.username,
      price: 1,
      quantity: amount,
      timestamp: Date.now()
    });
    
    localStorage.setItem('tradeSimUsers', JSON.stringify(users));
    
    return { success: true, message: 'Перевод выполнен успешно' };
  };

  const handleTrade = (type: 'BUY' | 'SELL', quantity: number) => {
    if (!selectedStock || !currentUser) return;
    
    const cost = quantity * selectedStock.price;

    if (type === 'BUY') {
      if (currentUser.cash < cost) return;
      
      setCurrentUser(prev => {
        if (!prev) return null;
        const existing = prev.holdings.find(h => h.symbol === selectedStock.symbol);
        const newHoldings = existing 
          ? prev.holdings.map(h => h.symbol === selectedStock.symbol ? { ...h, quantity: h.quantity + quantity } : h)
          : [...prev.holdings, { symbol: selectedStock.symbol, quantity, avgCost: selectedStock.price }];
        
        return {
          ...prev,
          cash: prev.cash - cost,
          holdings: newHoldings,
          transactions: [...prev.transactions, {
            id: Date.now().toString(),
            type: 'BUY',
            symbol: selectedStock.symbol,
            price: selectedStock.price,
            quantity,
            timestamp: Date.now()
          }]
        };
      });
    } else {
      const currentQty = getHoldingsForStock(selectedStock.symbol);
      if (currentQty < quantity) return;

      setCurrentUser(prev => {
        if (!prev) return null;
        const newHoldings = prev.holdings
          .map(h => h.symbol === selectedStock.symbol ? { ...h, quantity: h.quantity - quantity } : h)
          .filter(h => h.quantity > 0);

        return {
          ...prev,
          cash: prev.cash + cost,
          holdings: newHoldings,
          transactions: [...prev.transactions, {
            id: Date.now().toString(),
            type: 'SELL',
            symbol: selectedStock.symbol,
            price: selectedStock.price,
            quantity,
            timestamp: Date.now()
          }]
        };
      });
    }
  };

  // Admin Handlers
  const handleManipulateStock = (symbol: string, percentChange: number) => {
    setStocks(prev => prev.map(s => {
      if (s.symbol === symbol) {
        const newPrice = s.price * (1 + percentChange / 100);
        return {
          ...s,
          price: newPrice,
          change: newPrice - (s.price - s.change),
          changePercent: percentChange + s.changePercent
        };
      }
      return s;
    }));
  };
  
  const handleUpdateVolatility = (symbol: string, volatility: number) => {
     setStocks(prev => prev.map(s => 
       s.symbol === symbol ? { ...s, volatility } : s
     ));
  };

  const handleAddStock = (stock: Stock) => {
    if (stocks.length >= 15) return;
    setStocks(prev => [...prev, stock]);
  };

  const handleRemoveStock = (symbol: string) => {
    setStocks(prev => prev.filter(s => s.symbol !== symbol));
    if (selectedStockSymbol === symbol) {
      setSelectedStockSymbol(null);
    }
  };

  const handlePublishNews = (title: string, type: 'INFO' | 'BULLISH' | 'BEARISH') => {
    const newItem: NewsItem = {
      id: Date.now().toString(),
      title,
      type,
      timestamp: Date.now()
    };
    setNews(prev => [newItem, ...prev]);
  };

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              T
            </div>
            <h1 className="text-xl font-bold tracking-tight">TradeSim <span className="text-blue-600 font-light">AI</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
             {isAdmin && (
               <button 
                 onClick={() => setShowAdminPanel(true)}
                 className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 transition-colors"
                 title="Админ Панель"
               >
                 <ShieldAlert size={20} />
               </button>
             )}

             <button
               onClick={() => setShowCasino(true)}
               className="p-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500 rounded-full hover:bg-yellow-100 transition-colors flex items-center gap-2 px-3"
               title="Казино"
             >
                <Dices size={20} />
                <span className="hidden sm:inline font-bold text-xs uppercase">Casino</span>
             </button>

             <button
               onClick={() => setShowLeaderboard(true)}
               className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 rounded-full hover:bg-orange-100 transition-colors flex items-center gap-2 px-3"
               title="Лидерборд"
             >
                <Trophy size={20} />
             </button>

             <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${isMarketOpen ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'}`}>
               <span className={`w-2 h-2 rounded-full ${isMarketOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
               {isMarketOpen ? 'MARKET OPEN' : 'MARKET CLOSED'}
             </div>

             <button 
               onClick={() => setShowProfile(true)}
               className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
               title="Профиль"
             >
                <UserIcon size={20} />
             </button>
             
             <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors relative"
             >
               <Settings size={20} />
             </button>
          </div>
        </div>
      </header>

      {/* Settings Dropdown */}
      {showSettings && (
        <div className="absolute top-16 right-4 sm:right-8 z-40 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 animate-in fade-in slide-in-from-top-2">
           <div className="space-y-2">
             <button 
               onClick={() => setTheme(theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT)}
               className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
             >
               <span className="flex items-center gap-2">
                 {theme === Theme.LIGHT ? <Moon size={16} /> : <Sun size={16} />} 
                 {theme === Theme.LIGHT ? 'Тёмная тема' : 'Светлая тема'}
               </span>
             </button>

             <button 
               onClick={() => setIsMarketOpen(!isMarketOpen)}
               className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
             >
               <span className="flex items-center gap-2">
                 {isMarketOpen ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                 {isMarketOpen ? 'Пауза' : 'Возобновить'}
               </span>
             </button>

             <div className="h-px bg-gray-100 dark:bg-gray-700 my-2"></div>

             <button 
               onClick={handleLogout}
               className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 transition-colors text-sm"
             >
               <LogOut size={16} /> Выйти
             </button>
           </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <Profile 
          user={currentUser} 
          onClose={() => setShowProfile(false)} 
          onLogout={handleLogout}
          onTransfer={handleTransfer}
        />
      )}

      {/* Admin Panel Modal */}
      {showAdminPanel && isAdmin && (
        <AdminPanel 
          onClose={() => setShowAdminPanel(false)}
          stocks={stocks}
          onManipulateStock={handleManipulateStock}
          onUpdateVolatility={handleUpdateVolatility}
          onPublishNews={handlePublishNews}
          onAddStock={handleAddStock}
          onRemoveStock={handleRemoveStock}
        />
      )}

      {/* Casino Modal */}
      {showCasino && currentUser && (
        <Casino 
          onClose={() => setShowCasino(false)}
          user={currentUser}
          onUpdateCash={handleCasinoUpdate}
        />
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && currentUser && (
        <Leaderboard 
          onClose={() => setShowLeaderboard(false)}
          stocks={stocks}
          currentUser={currentUser}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PortfolioSummary 
          userState={currentUser} 
          currentEquity={currentEquity} 
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
           <div className="lg:col-span-2 h-64">
             <NewsFeed news={news} />
           </div>
           <div className="lg:col-span-1 h-64">
             <PortfolioDistribution 
                holdings={currentUser.holdings}
                stocks={stocks}
                cash={currentUser.cash}
             />
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Market List */}
          <div className="lg:col-span-2 space-y-4">
             <div className="flex justify-between items-center">
               <h2 className="text-lg font-bold text-gray-900 dark:text-white">Котировки</h2>
               <span className="text-xs text-gray-500">Симуляция рынка РФ</span>
             </div>
             <StockTable 
               stocks={stocks} 
               onSelectStock={(s) => setSelectedStockSymbol(s.symbol)} 
               selectedStockSymbol={selectedStockSymbol || undefined}
             />
          </div>

          {/* Trading Panel */}
          <div className="lg:col-span-1 h-[600px] lg:h-auto lg:sticky lg:top-24">
            <TradingPanel 
              selectedStock={selectedStock}
              maxAffordable={selectedStock ? Math.floor(currentUser.cash / selectedStock.price) : 0}
              maxSellable={selectedStock ? getHoldingsForStock(selectedStock.symbol) : 0}
              onTrade={handleTrade}
              isMarketOpen={isMarketOpen}
            />
          </div>
        </div>
      </main>

      {/* Floating AI Assistant */}
      <AIAnalyst 
        stocks={stocks} 
        holdings={currentUser.holdings} 
        totalEquity={currentEquity + currentUser.cash}
      />
    </div>
  );
}