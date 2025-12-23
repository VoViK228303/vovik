import React, { useState, useEffect } from 'react';
import { Stock, NewsItem, Transaction } from '../types.ts';
import { ShieldAlert, TrendingUp, Users, Newspaper, X, Ban, CheckCircle, Search, ScrollText, Plus, Trash2, List, Activity } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
  stocks: Stock[];
  onManipulateStock: (symbol: string, percentChange: number) => void;
  onUpdateVolatility: (symbol: string, volatility: number) => void;
  onPublishNews: (title: string, type: 'INFO' | 'BULLISH' | 'BEARISH') => void;
  onAddStock: (stock: Stock) => void;
  onRemoveStock: (symbol: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, stocks, onManipulateStock, onUpdateVolatility, onPublishNews, onAddStock, onRemoveStock }) => {
  const [activeTab, setActiveTab] = useState<'MARKET' | 'NEWS' | 'USERS'>('USERS');
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserLogs, setSelectedUserLogs] = useState<{username: string, transactions: Transaction[]} | null>(null);

  // Market Manipulation State
  const [manipulateSymbol, setManipulateSymbol] = useState(stocks[0]?.symbol || '');
  const [manipulatePercent, setManipulatePercent] = useState('');

  // Volatility State
  const [volatilitySymbol, setVolatilitySymbol] = useState(stocks[0]?.symbol || '');
  const [volatilityValue, setVolatilityValue] = useState('0.5');

  // Add Stock State
  const [newStockSymbol, setNewStockSymbol] = useState('');
  const [newStockName, setNewStockName] = useState('');
  const [newStockPrice, setNewStockPrice] = useState('');

  // News State
  const [newsTitle, setNewsTitle] = useState('');
  const [newsType, setNewsType] = useState<'INFO' | 'BULLISH' | 'BEARISH'>('INFO');

  // Load users from localStorage
  const loadUsers = () => {
    const usersStr = localStorage.getItem('tradeSimUsers');
    if (usersStr) {
      const usersObj = JSON.parse(usersStr);
      const userList = Object.keys(usersObj).map(key => ({
        username: key,
        ...usersObj[key]
      }));
      setUsers(userList);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleBan = (username: string) => {
    const usersStr = localStorage.getItem('tradeSimUsers');
    if (usersStr) {
      const usersObj = JSON.parse(usersStr);
      if (usersObj[username]) {
        usersObj[username].state.isBanned = !usersObj[username].state.isBanned;
        localStorage.setItem('tradeSimUsers', JSON.stringify(usersObj));
        loadUsers(); // Refresh list
      }
    }
  };

  const handlePublishNews = () => {
    if (!newsTitle) return;
    onPublishNews(newsTitle, newsType);
    setNewsTitle('');
  };

  const handleManipulate = () => {
    const percent = parseFloat(manipulatePercent);
    if (!manipulateSymbol || isNaN(percent)) return;
    onManipulateStock(manipulateSymbol, percent);
    setManipulatePercent('');
  };

  const handleUpdateVolatility = () => {
    const volPercent = parseFloat(volatilityValue);
    if (!volatilitySymbol || isNaN(volPercent) || volPercent < 0) return;
    // Convert percent to factor (e.g. 1% -> 0.01)
    onUpdateVolatility(volatilitySymbol, volPercent / 100);
    // Visual feedback could be added here
  };

  const handleAddStockSubmit = () => {
    if (!newStockSymbol || !newStockName || !newStockPrice) return;
    
    // Validate unique symbol
    if (stocks.find(s => s.symbol === newStockSymbol.toUpperCase())) {
      alert('Акция с таким тикером уже существует!');
      return;
    }

    const price = parseFloat(newStockPrice);
    if (isNaN(price) || price <= 0) return;

    const newStock: Stock = {
      symbol: newStockSymbol.toUpperCase(),
      name: newStockName,
      price: price,
      change: 0,
      changePercent: 0,
      volume: 100000 + Math.random() * 900000,
      high: price,
      low: price,
      volatility: 0.005 // Default 0.5%
    };

    onAddStock(newStock);
    setNewStockSymbol('');
    setNewStockName('');
    setNewStockPrice('');
  };

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl bg-gray-900 text-gray-100 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={24} />
            <h2 className="text-xl font-bold text-white">Админ Панель</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-gray-800/50">
          <button 
            onClick={() => setActiveTab('USERS')}
            className={`flex-1 py-3 font-semibold text-sm flex items-center justify-center gap-2 ${activeTab === 'USERS' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
          >
            <Users size={16} /> Пользователи
          </button>
          <button 
             onClick={() => setActiveTab('MARKET')}
             className={`flex-1 py-3 font-semibold text-sm flex items-center justify-center gap-2 ${activeTab === 'MARKET' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
          >
            <TrendingUp size={16} /> Рынок и Листинг
          </button>
          <button 
             onClick={() => setActiveTab('NEWS')}
             className={`flex-1 py-3 font-semibold text-sm flex items-center justify-center gap-2 ${activeTab === 'NEWS' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
          >
            <Newspaper size={16} /> Генератор новостей
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-900">
          
          {/* USERS TAB */}
          {activeTab === 'USERS' && (
            <div className="space-y-4">
              {selectedUserLogs ? (
                 <div className="space-y-4">
                    <button onClick={() => setSelectedUserLogs(null)} className="text-sm text-blue-400 hover:underline mb-2">&larr; Назад к списку</button>
                    <h3 className="text-lg font-bold">Логи транзакций: {selectedUserLogs.username}</h3>
                    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                       <table className="w-full text-sm text-left">
                         <thead className="bg-gray-700 text-gray-400">
                           <tr>
                             <th className="p-3">Время</th>
                             <th className="p-3">Тип</th>
                             <th className="p-3">Символ/Кому</th>
                             <th className="p-3 text-right">Сумма/Кол-во</th>
                             <th className="p-3 text-right">Цена</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-700">
                           {selectedUserLogs.transactions.length === 0 && (
                             <tr><td colSpan={5} className="p-4 text-center text-gray-500">Нет транзакций</td></tr>
                           )}
                           {selectedUserLogs.transactions.slice().reverse().map(tx => (
                             <tr key={tx.id} className="hover:bg-gray-700/50">
                               <td className="p-3 text-gray-400">{new Date(tx.timestamp).toLocaleString()}</td>
                               <td className="p-3 font-medium">
                                 <span className={`px-2 py-0.5 rounded text-xs ${tx.type === 'BUY' ? 'bg-emerald-900 text-emerald-400' : tx.type === 'SELL' ? 'bg-rose-900 text-rose-400' : 'bg-blue-900 text-blue-400'}`}>
                                   {tx.type}
                                 </span>
                               </td>
                               <td className="p-3">{tx.symbol}</td>
                               <td className="p-3 text-right">{tx.quantity}</td>
                               <td className="p-3 text-right">{tx.price} ₽</td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                    </div>
                 </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="Поиск по никнейму..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-700 text-gray-400">
                        <tr>
                          <th className="p-3">Пользователь</th>
                          <th className="p-3 text-right">Баланс</th>
                          <th className="p-3 text-center">Статус</th>
                          <th className="p-3 text-center">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {filteredUsers.map(u => (
                          <tr key={u.username} className="hover:bg-gray-700/50">
                            <td className="p-3 font-medium flex items-center gap-2">
                               <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs">{u.username.substring(0,2).toUpperCase()}</div>
                               {u.username}
                            </td>
                            <td className="p-3 text-right text-emerald-400 font-mono">
                              {u.state.cash.toFixed(2)} ₽
                            </td>
                            <td className="p-3 text-center">
                              {u.state.isBanned ? (
                                <span className="text-red-500 text-xs font-bold border border-red-500 px-2 py-1 rounded">BANNED</span>
                              ) : (
                                <span className="text-emerald-500 text-xs font-bold border border-emerald-500 px-2 py-1 rounded">ACTIVE</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                               <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => setSelectedUserLogs({username: u.username, transactions: u.state.transactions})}
                                    className="p-2 bg-blue-900/50 hover:bg-blue-900 text-blue-400 rounded-lg transition-colors"
                                    title="Логи"
                                  >
                                    <ScrollText size={16} />
                                  </button>
                                  <button 
                                    onClick={() => toggleBan(u.username)}
                                    className={`p-2 rounded-lg transition-colors ${u.state.isBanned ? 'bg-emerald-900/50 hover:bg-emerald-900 text-emerald-400' : 'bg-red-900/50 hover:bg-red-900 text-red-400'}`}
                                    title={u.state.isBanned ? "Разбанить" : "Забанить"}
                                  >
                                    {u.state.isBanned ? <CheckCircle size={16} /> : <Ban size={16} />}
                                  </button>
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* MARKET TAB */}
          {activeTab === 'MARKET' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Price Manipulation */}
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-yellow-500">
                  <TrendingUp size={20} /> Управление ценой
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Тикер (Акция)</label>
                    <select 
                      value={manipulateSymbol} 
                      onChange={(e) => setManipulateSymbol(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                    >
                      {stocks.map(s => <option key={s.symbol} value={s.symbol}>{s.symbol} - {s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Изменение цены (%)</label>
                    <div className="flex gap-2">
                       <input 
                        type="number" 
                        placeholder="-50 или 50" 
                        value={manipulatePercent}
                        onChange={(e) => setManipulatePercent(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                      />
                      <button 
                        onClick={handleManipulate}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                      >
                        OK
                      </button>
                    </div>
                  </div>
                </div>
              </div>

               {/* Volatility Control */}
               <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-purple-500">
                  <Activity size={20} /> Управление волатильностью
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Тикер (Акция)</label>
                    <select 
                      value={volatilitySymbol} 
                      onChange={(e) => setVolatilitySymbol(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      {stocks.map(s => <option key={s.symbol} value={s.symbol}>{s.symbol} (Cur: {(s.volatility * 100).toFixed(1)}%)</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Новая волатильность (% за тик)</label>
                    <div className="flex gap-2">
                       <input 
                        type="number" 
                        step="0.1"
                        placeholder="0.5" 
                        value={volatilityValue}
                        onChange={(e) => setVolatilityValue(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                      <button 
                        onClick={handleUpdateVolatility}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                      >
                        OK
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Рекомендуется: 0.1% - 2%. Высокая волатильность может привести к нереалистичным скачкам.
                    </p>
                  </div>
                </div>
              </div>

              {/* Listing Management */}
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit md:col-span-2">
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-500">
                   <List size={20} /> Управление листингом
                 </h3>
                 
                 <div className="space-y-4 mb-6 pb-6 border-b border-gray-700">
                   <h4 className="text-sm font-semibold text-gray-400">Добавить IPO</h4>
                   <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        placeholder="Тикер (TCSG)" 
                        value={newStockSymbol}
                        onChange={(e) => setNewStockSymbol(e.target.value.toUpperCase())}
                        maxLength={5}
                        className="bg-gray-900 border border-gray-600 rounded-lg p-2 text-sm text-white"
                      />
                      <input 
                        type="text" 
                        placeholder="Название" 
                        value={newStockName}
                        onChange={(e) => setNewStockName(e.target.value)}
                        className="bg-gray-900 border border-gray-600 rounded-lg p-2 text-sm text-white"
                      />
                   </div>
                   <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="Цена старта (₽)" 
                        value={newStockPrice}
                        onChange={(e) => setNewStockPrice(e.target.value)}
                        className="flex-1 bg-gray-900 border border-gray-600 rounded-lg p-2 text-sm text-white"
                      />
                      <button 
                        onClick={handleAddStockSubmit}
                        disabled={stocks.length >= 15}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1"
                      >
                        <Plus size={16} /> Add
                      </button>
                   </div>
                   {stocks.length >= 15 && <p className="text-xs text-red-400">Достигнут лимит акций (15)</p>}
                 </div>

                 <div className="space-y-2">
                   <h4 className="text-sm font-semibold text-gray-400">Активные акции ({stocks.length})</h4>
                   <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                      {stocks.map(s => (
                        <div key={s.symbol} className="flex items-center justify-between p-2 bg-gray-900/50 rounded hover:bg-gray-900">
                          <span className="text-sm font-mono">{s.symbol}</span>
                          <button 
                            onClick={() => {
                              // Direct removal without confirm
                              onRemoveStock(s.symbol);
                            }}
                            className="text-gray-500 hover:text-red-500 transition-colors"
                            title="Делистинг (Удалить)"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                   </div>
                 </div>
              </div>

            </div>
          )}

          {/* NEWS TAB */}
          {activeTab === 'NEWS' && (
             <div className="max-w-md mx-auto space-y-6">
               <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                   <Newspaper className="text-blue-500" /> Создать новость
                 </h3>
                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm text-gray-400 mb-1">Заголовок новости</label>
                     <textarea 
                       value={newsTitle} 
                       onChange={(e) => setNewsTitle(e.target.value)}
                       rows={3}
                       className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                       placeholder="Срочно: Биткоин упал до нуля..."
                     />
                   </div>
                   <div>
                      <label className="block text-sm text-gray-400 mb-1">Влияние (для цвета)</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={() => setNewsType('BULLISH')}
                          className={`p-2 rounded-lg border ${newsType === 'BULLISH' ? 'bg-emerald-900/50 border-emerald-500 text-emerald-400' : 'border-gray-600 text-gray-500'}`}
                        >
                          Хорошая
                        </button>
                        <button 
                          onClick={() => setNewsType('BEARISH')}
                          className={`p-2 rounded-lg border ${newsType === 'BEARISH' ? 'bg-red-900/50 border-red-500 text-red-400' : 'border-gray-600 text-gray-500'}`}
                        >
                          Плохая
                        </button>
                        <button 
                          onClick={() => setNewsType('INFO')}
                          className={`p-2 rounded-lg border ${newsType === 'INFO' ? 'bg-blue-900/50 border-blue-500 text-blue-400' : 'border-gray-600 text-gray-500'}`}
                        >
                          Инфо
                        </button>
                      </div>
                   </div>
                   <button 
                     onClick={handlePublishNews}
                     className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors mt-2"
                   >
                     Опубликовать новость
                   </button>
                 </div>
               </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};