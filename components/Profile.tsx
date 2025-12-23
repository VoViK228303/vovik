
import React, { useState } from 'react';
import { UserState } from '../types.ts';
import { User, Send, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ProfileProps {
  user: UserState;
  onClose: () => void;
  onLogout: () => void;
  // Fix: changed return type to Promise to match App.tsx implementation
  onTransfer: (recipient: string, amount: number) => Promise<{ success: boolean; message: string }>;
}

export const Profile: React.FC<ProfileProps> = ({ user, onClose, onLogout, onTransfer }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Fix: made handleTransfer async to await onTransfer result and fix type mismatch in App.tsx
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    
    if (!recipient || isNaN(amountNum) || amountNum <= 0) {
      setStatus({ type: 'error', message: 'Пожалуйста, введите корректные данные' });
      return;
    }

    const result = await onTransfer(recipient, amountNum);
    setStatus({ 
      type: result.success ? 'success' : 'error', 
      message: result.message 
    });

    if (result.success) {
      setAmount('');
      setRecipient('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{user.username}</h2>
              <p className="text-xs text-gray-500">Профиль Инвестора</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <div className="text-xs text-gray-500 mb-1">Баланс</div>
              <div className="font-bold text-gray-900 dark:text-white">
                {user.cash.toLocaleString('ru-RU')} ₽
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
               <div className="text-xs text-gray-500 mb-1">Сделок</div>
              <div className="font-bold text-gray-900 dark:text-white">
                {user.transactions.length}
              </div>
            </div>
          </div>

          {/* Transfer Form */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Send size={16} /> Перевод средств
            </h3>
            
            <form onSubmit={handleTransfer} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Имя получателя"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="relative">
                <input
                  type="number"
                  placeholder="Сумма"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg pl-4 pr-8 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="absolute right-3 top-2 text-gray-400 text-sm">₽</span>
              </div>
              
              {status && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'}`}>
                  {status.type === 'success' ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
                  {status.message}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Отправить
              </button>
            </form>
          </div>

          <button 
            onClick={onLogout}
            className="w-full py-3 text-rose-600 bg-rose-50 dark:bg-rose-900/10 hover:bg-rose-100 dark:hover:bg-rose-900/20 rounded-xl font-medium transition-colors text-sm"
          >
            Выйти из аккаунта
          </button>
        </div>

      </div>
    </div>
  );
};
