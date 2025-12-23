import React, { useState } from 'react';
import { User, Stock } from '../types';
import { authService } from '../services/authService';

interface UserProfileProps {
  user: User;
  stocks: Stock[]; // Added stocks to calculate current value
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (user: User) => void;
  onLogout: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, stocks, isOpen, onClose, onUpdate, onLogout }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState<'portfolio' | 'transfer'>('portfolio');

  if (!isOpen) return null;

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setMsg({ text: 'Введите корректную сумму', type: 'error' });
      return;
    }

    const result = authService.transferMoney(user.username, recipient, val);
    
    if (result.success) {
      setMsg({ text: result.message, type: 'success' });
      setAmount('');
      setRecipient('');
      // Update local state
      const updatedUser = authService.getCurrentUser();
      if (updatedUser) onUpdate(updatedUser);
    } else {
      setMsg({ text: result.message, type: 'error' });
    }
  };

  const holdingsList = Object.entries(user.portfolio.holdings).map(([symbol, item]) => {
    const stock = stocks.find(s => s.symbol === symbol);
    const currentPrice = stock?.price || 0;
    const marketValue = currentPrice * item.quantity;
    const investValue = item.avgPrice * item.quantity;
    const profit = marketValue - investValue;
    const profitPercent = investValue > 0 ? (profit / investValue) * 100 : 0;
    
    return {
      symbol,
      name: stock?.name || symbol,
      quantity: item.quantity,
      avgPrice: item.avgPrice,
      currentPrice,
      marketValue,
      profit,
      profitPercent
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.username}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Инвестор</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex border-b border-gray-100 dark:border-slate-700 shrink-0">
          <button 
            onClick={() => setActiveTab('portfolio')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'portfolio' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-slate-700/50' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/30'}`}
          >
            Мой Портфель
          </button>
          <button 
            onClick={() => setActiveTab('transfer')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'transfer' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-slate-700/50' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/30'}`}
          >
            Переводы
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl">
                  <span className="block text-sm text-gray-500 dark:text-gray-400">Баланс (кэш)</span>
                  <span className="block text-2xl font-bold text-gray-900 dark:text-white">{user.portfolio.cash.toFixed(2)}₽</span>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl">
                  <span className="block text-sm text-gray-500 dark:text-gray-400">Стоимость акций</span>
                  <span className="block text-2xl font-bold text-gray-900 dark:text-white">
                    {holdingsList.reduce((acc, h) => acc + h.marketValue, 0).toFixed(2)}₽
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Ваши Акции</h3>
                {holdingsList.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8 bg-gray-50 dark:bg-slate-700/30 rounded-lg">
                    Портфель пуст. Купите акции на рынке!
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-slate-700">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400">
                        <tr>
                          <th className="p-3 font-medium">Акция</th>
                          <th className="p-3 font-medium text-right">Кол-во</th>
                          <th className="p-3 font-medium text-right">Ср. Цена</th>
                          <th className="p-3 font-medium text-right">Тек. Цена</th>
                          <th className="p-3 font-medium text-right">P&L</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {holdingsList.map((h) => (
                          <tr key={h.symbol} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                            <td className="p-3">
                              <div className="font-bold text-gray-900 dark:text-white">{h.symbol}</div>
                              <div className="text-xs text-gray-500">{h.name}</div>
                            </td>
                            <td className="p-3 text-right font-medium text-gray-900 dark:text-white">{h.quantity}</td>
                            <td className="p-3 text-right text-gray-500 dark:text-gray-400">{h.avgPrice.toFixed(2)}₽</td>
                            <td className="p-3 text-right text-gray-900 dark:text-white">{h.currentPrice.toFixed(2)}₽</td>
                            <td className={`p-3 text-right font-bold ${h.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {h.profit >= 0 ? '+' : ''}{h.profit.toFixed(2)}₽<br/>
                              <span className="text-xs font-normal">({h.profitPercent.toFixed(2)}%)</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'transfer' && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-blue-800 dark:text-blue-200 text-sm">
                Вы можете перевести свободные средства (кэш) другому зарегистрированному пользователю.
              </div>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Получатель</label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Имя пользователя"
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Сумма</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <span className="absolute right-4 top-3.5 text-gray-400">₽</span>
                  </div>
                  <div className="text-xs text-right mt-1 text-gray-500">Доступно: {user.portfolio.cash.toFixed(2)}₽</div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-green-500/30"
                >
                  Перевести средства
                </button>
                {msg.text && (
                  <div className={`p-3 rounded-lg text-sm text-center ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {msg.text}
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-700 shrink-0 bg-gray-50 dark:bg-slate-800/50">
          <button 
            onClick={onLogout}
            className="w-full py-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium text-sm"
          >
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  );
};