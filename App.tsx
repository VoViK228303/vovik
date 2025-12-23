import React, { useState, useEffect } from 'react';
import { Stock, OrderType, Transaction, MarketStatus, User } from './types';
import { AppHeader } from './components/AppHeader';
import { StockTable } from './components/StockTable';
import { TradingPanel } from './components/TradingPanel';
import { MarketAnalyst } from './components/MarketAnalyst';
import { SettingsModal } from './components/SettingsModal';
import { AuthScreen } from './components/AuthScreen';
import { UserProfile } from './components/UserProfile';
import { AdminPanel } from './components/AdminPanel';
import { authService } from './services/authService';

// Initial simulated Russian stocks (Price adjusted for ~1000 RUB balance)
const INITIAL_STOCKS: Stock[] = [
  { symbol: 'SBER', name: 'Sberbank', price: 275.50, change: 1.5, changePercent: 0.55 },
  { symbol: 'GAZP', name: 'Gazprom', price: 164.20, change: -0.8, changePercent: -0.49 },
  { symbol: 'LKOH', name: 'Lukoil', price: 450.00, change: 5.5, changePercent: 1.22 }, // Artificial split for game balance
  { symbol: 'YNDX', name: 'Yandex', price: 320.80, change: 2.8, changePercent: 0.88 },
  { symbol: 'ROSN', name: 'Rosneft', price: 180.40, change: -1.4, changePercent: -0.77 },
  { symbol: 'AFLT', name: 'Aeroflot', price: 40.10, change: 0.2, changePercent: 0.50 },
];

export default function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Application State
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [marketStatus, setMarketStatus] = useState<MarketStatus>(MarketStatus.OPEN);
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [selectedStock, setSelectedStock] = useState<Stock>(INITIAL_STOCKS[0]);
  
  // Timer State
  const UPDATE_INTERVAL = 10 * 60 * 1000;
  const [nextUpdateTimestamp, setNextUpdateTimestamp] = useState<number>(Date.now() + UPDATE_INTERVAL);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Check login on mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setIsAuthChecking(false);
    
    // Request Notification permission
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Theme Management
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Market Simulation Logic
  useEffect(() => {
    if (marketStatus === MarketStatus.CLOSED) return;

    const interval = setInterval(() => {
      // 1. Update Stocks
      setStocks(currentStocks => 
        currentStocks.map(stock => {
          const maxPercentChange = 5; 
          const percentChange = Math.random() * maxPercentChange;
          const direction = Math.random() > 0.5 ? 1 : -1;
          
          const changeFactor = 1 + (direction * (percentChange / 100));
          const newPrice = Math.max(0.01, stock.price * changeFactor);
          const priceChange = newPrice - stock.price;
          
          const newDailyChange = stock.change + priceChange;
          const openPrice = newPrice - newDailyChange;
          const newChangePercent = (newDailyChange / openPrice) * 100;

          return {
            ...stock,
            price: newPrice,
            change: newDailyChange,
            changePercent: newChangePercent
          };
        })
      );

      // 2. Reset Timer
      setNextUpdateTimestamp(Date.now() + UPDATE_INTERVAL);

      // 3. Send Notification
      if ("Notification" in window && Notification.permission === "granted") {
         new Notification("TradeSim AI: Рынок обновлен!", {
           body: "Цены акций изменились. Проверьте свой портфель.",
           icon: "/favicon.ico"
         });
      }

    }, UPDATE_INTERVAL); 

    return () => clearInterval(interval);
  }, [marketStatus]);

  // Update selected stock reference when stocks update
  useEffect(() => {
    const updated = stocks.find(s => s.symbol === selectedStock.symbol);
    if (updated) setSelectedStock(updated);
  }, [stocks, selectedStock.symbol]);

  // Sync Current User Portfolio from DB (in case of updates)
  const refreshUser = () => {
    const updated = authService.getCurrentUser();
    if (updated) setCurrentUser(updated);
  };

  // Trading Logic
  const handleTrade = (type: OrderType, quantity: number) => {
    if (!currentUser) return;

    const cost = selectedStock.price * quantity;
    let newPortfolio = { ...currentUser.portfolio };
    let newTransactions = [...currentUser.transactions];

    if (type === OrderType.BUY) {
      if (newPortfolio.cash < cost) {
        alert("Недостаточно средств");
        return;
      }
      
      const currentQty = newPortfolio.holdings[selectedStock.symbol]?.quantity || 0;
      const currentAvg = newPortfolio.holdings[selectedStock.symbol]?.avgPrice || 0;
      const newQty = currentQty + quantity;
      const newAvg = ((currentQty * currentAvg) + cost) / newQty;

      newPortfolio.cash -= cost;
      newPortfolio.holdings[selectedStock.symbol] = { quantity: newQty, avgPrice: newAvg };

    } else {
      const currentHolding = newPortfolio.holdings[selectedStock.symbol];
      if (!currentHolding || currentHolding.quantity < quantity) {
        alert("Недостаточно активов");
        return;
      }
      
      const newQty = currentHolding.quantity - quantity;
      if (newQty <= 0) {
        delete newPortfolio.holdings[selectedStock.symbol];
      } else {
        newPortfolio.holdings[selectedStock.symbol] = { ...currentHolding, quantity: newQty };
      }
      newPortfolio.cash += cost;
    }

    const tx: Transaction = {
      id: Date.now().toString(),
      type,
      symbol: selectedStock.symbol,
      price: selectedStock.price,
      quantity,
      timestamp: new Date().toISOString()
    };
    newTransactions.unshift(tx);

    // Persist
    authService.updateUserData(currentUser.username, {
      portfolio: newPortfolio,
      transactions: newTransactions
    });

    refreshUser();
  };

  const handleReset = () => {
    if (!currentUser) return;
    authService.updateUserData(currentUser.username, {
      portfolio: {
        cash: 1000,
        holdings: {},
        initialValue: 1000
      },
      transactions: []
    });
    refreshUser();
    setStocks(INITIAL_STOCKS);
  };

  // Admin Market Actions
  const handleMarketManipulation = (percentChange: number, symbol: string = 'ALL') => {
    setStocks(currentStocks => 
      currentStocks.map(stock => {
        // Apply only to targeted stock, or all if symbol is 'ALL'
        if (symbol !== 'ALL' && stock.symbol !== symbol) {
          return stock;
        }

        const multiplier = 1 + (percentChange / 100);
        const newPrice = Math.max(0.01, stock.price * multiplier);
        const priceChange = newPrice - stock.price;
        
        const newDailyChange = stock.change + priceChange;
        const openPrice = newPrice - newDailyChange;
        const newChangePercent = openPrice !== 0 ? (newDailyChange / openPrice) * 100 : 0;

        return {
          ...stock,
          price: newPrice,
          change: newDailyChange,
          changePercent: newChangePercent
        };
      })
    );

    // Send immediate notification
    if ("Notification" in window && Notification.permission === "granted") {
      const isGlobal = symbol === 'ALL';
      const action = percentChange > 0 ? 'вырос' : 'упал';
      const title = isGlobal ? "TradeSim AI: Рыночное вмешательство!" : `TradeSim AI: Новости ${symbol}!`;
      const body = isGlobal 
        ? `Рынок ${action} на ${Math.abs(percentChange)}%!`
        : `Акции ${symbol} ${action} на ${Math.abs(percentChange)}%!`;
        
      new Notification(title, {
        body: body,
        icon: "/favicon.ico"
      });
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsProfileOpen(false);
  };

  if (isAuthChecking) return <div className="min-h-screen bg-gray-100 dark:bg-slate-900" />;

  if (!currentUser) {
    return (
      <>
        <AuthScreen onLogin={setCurrentUser} />
        <div className="hidden" /> 
      </>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <AppHeader 
        portfolio={currentUser.portfolio} 
        stocks={stocks} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        username={currentUser.username}
        isAdmin={currentUser.role === 'admin'}
        nextUpdateTimestamp={nextUpdateTimestamp}
      />

      <main className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Market & Chart */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
             <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Рынок</h2>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${marketStatus === MarketStatus.OPEN ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {marketStatus === MarketStatus.OPEN ? 'ОТКРЫТ' : 'ЗАКРЫТ'}
                </span>
             </div>
             <StockTable 
               stocks={stocks} 
               selectedSymbol={selectedStock.symbol} 
               onSelect={setSelectedStock} 
               holdings={currentUser.portfolio.holdings} 
             />
          </div>

          <MarketAnalyst selectedStock={selectedStock} />
        </div>

        {/* Right Column: Trading */}
        <div className="lg:col-span-4 space-y-6">
          <TradingPanel 
            stock={selectedStock} 
            maxBuy={currentUser.portfolio.cash / selectedStock.price}
            maxSell={currentUser.portfolio.holdings[selectedStock.symbol]?.quantity || 0}
            onTrade={handleTrade}
            marketStatus={marketStatus}
          />

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
             <h3 className="text-lg font-semibold mb-3 dark:text-white">История операций</h3>
             <div className="max-h-60 overflow-y-auto space-y-2">
               {currentUser.transactions.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm">Операций пока нет.</p>}
               {currentUser.transactions.map(t => (
                 <div key={t.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-slate-700/50 rounded">
                   <div>
                     <span className={`font-bold ${t.type === OrderType.BUY ? 'text-green-600' : 'text-red-500'}`}>
                       {t.type === OrderType.BUY ? 'ПОКУПКА' : 'ПРОДАЖА'}
                     </span>
                     <span className="ml-2 font-medium dark:text-gray-200">{t.symbol}</span>
                   </div>
                   <div className="text-right">
                     <div className="dark:text-gray-200">{t.quantity} шт @ {t.price.toFixed(2)}₽</div>
                     <div className="text-xs text-gray-400">{new Date(t.timestamp).toLocaleTimeString()}</div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </main>

      {isSettingsOpen && (
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)}
          theme={theme}
          toggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          marketStatus={marketStatus}
          toggleMarket={() => setMarketStatus(s => s === MarketStatus.OPEN ? MarketStatus.CLOSED : MarketStatus.OPEN)}
          onReset={handleReset}
        />
      )}

      {isProfileOpen && (
        <UserProfile 
          user={currentUser}
          stocks={stocks} 
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onUpdate={refreshUser}
          onLogout={handleLogout}
        />
      )}

      {isAdminOpen && currentUser.role === 'admin' && (
        <AdminPanel 
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          stocks={stocks}
          onMarketManipulate={handleMarketManipulation}
        />
      )}
    </div>
  );
}