import React, { useState } from 'react';
import { UserState } from '../types.ts';
import { X, Dices, Spade } from 'lucide-react';
import { Slots } from './casino/Slots.tsx';
import { Blackjack } from './casino/Blackjack.tsx';

interface CasinoProps {
  onClose: () => void;
  user: UserState;
  onUpdateCash: (amount: number) => void;
}

export const Casino: React.FC<CasinoProps> = ({ onClose, user, onUpdateCash }) => {
  const [activeGame, setActiveGame] = useState<'SLOTS' | 'BLACKJACK'>('SLOTS');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gray-900 text-white p-6 flex justify-between items-center bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-gray-900 shadow-lg shadow-yellow-500/50">
              <Dices size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-wider text-yellow-500 drop-shadow-sm">Las Vegas</h2>
              <p className="text-xs text-gray-400 font-mono">Баланс: {user.cash.toLocaleString()} ₽</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Nav */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button 
            onClick={() => setActiveGame('SLOTS')}
            className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeGame === 'SLOTS' ? 'bg-white dark:bg-gray-900 text-yellow-600 dark:text-yellow-500 border-t-2 border-yellow-500' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <Dices size={18} /> Игровые автоматы
          </button>
          <button 
            onClick={() => setActiveGame('BLACKJACK')}
            className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeGame === 'BLACKJACK' ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-500 border-t-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <Spade size={18} /> Блэкджек
          </button>
        </div>

        {/* Game Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          {activeGame === 'SLOTS' && (
            <Slots balance={user.cash} onUpdateCash={onUpdateCash} />
          )}
          {activeGame === 'BLACKJACK' && (
            <Blackjack balance={user.cash} onUpdateCash={onUpdateCash} />
          )}
        </div>
      </div>
    </div>
  );
};