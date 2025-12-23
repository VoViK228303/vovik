import React, { useState, useEffect } from 'react';
import { RefreshCw, Coins } from 'lucide-react';

interface SlotsProps {
  onUpdateCash: (amount: number) => void;
  balance: number;
}

// Increased symbol count to 9 to reduce pair probability from ~48% to ~29%
const SYMBOLS = ['🍒', '🍋', '🍇', '💎', '7️⃣', '🔔', '🍀', '👑', '🎱'];

const PAYOUTS = {
  '🍒': 2,
  '🍋': 3,
  '🎱': 4,
  '🍇': 5,
  '🔔': 8,
  '💎': 10,
  '🍀': 20,
  '7️⃣': 50,
  '👑': 100
};

export const Slots: React.FC<SlotsProps> = ({ onUpdateCash, balance }) => {
  const [reels, setReels] = useState<string[]>(['7️⃣', '7️⃣', '7️⃣']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [bet, setBet] = useState(100);
  const [message, setMessage] = useState('');
  const [winAmount, setWinAmount] = useState(0);

  const spin = () => {
    if (balance < bet) {
      setMessage('Недостаточно средств!');
      return;
    }

    onUpdateCash(-bet);
    setIsSpinning(true);
    setMessage('');
    setWinAmount(0);

    // Animation simulation
    let intervalCount = 0;
    const interval = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      ]);
      intervalCount++;
      if (intervalCount > 10) {
        clearInterval(interval);
        finalizeSpin();
      }
    }, 100);
  };

  const finalizeSpin = () => {
    const finalReels = [
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
    ];
    setReels(finalReels);
    setIsSpinning(false);

    // Check Win
    if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
      const symbol = finalReels[0];
      const multiplier = PAYOUTS[symbol as keyof typeof PAYOUTS] || 0;
      const win = bet * multiplier;
      setWinAmount(win);
      onUpdateCash(win);
      setMessage(`JACKPOT! Вы выиграли ${win} ₽`);
    } else if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2]) {
      // Small win for pair
      const win = Math.floor(bet * 1.5);
      setWinAmount(win);
      onUpdateCash(win);
      setMessage(`Пара! Выигрыш ${win} ₽`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-6">
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-8 rounded-3xl border-4 border-yellow-500 shadow-2xl relative">
        <div className="flex gap-4 mb-6">
          {reels.map((symbol, i) => (
            <div key={i} className="w-20 h-28 bg-white rounded-lg flex items-center justify-center text-5xl shadow-inner overflow-hidden border-2 border-gray-300">
               <div className={`transition-transform duration-100 ${isSpinning ? 'animate-pulse blur-sm' : ''}`}>
                 {symbol}
               </div>
            </div>
          ))}
        </div>
        
        {/* Payout Table Hint */}
        <div className="absolute -right-32 top-0 bg-gray-800 p-4 rounded-xl border border-gray-700 hidden lg:block text-xs text-gray-300 w-28 max-h-80 overflow-y-auto custom-scrollbar">
           <h4 className="font-bold text-yellow-500 mb-2 border-b border-gray-600 pb-1">Выплаты (x3)</h4>
           {Object.entries(PAYOUTS).sort(([,a], [,b]) => a - b).map(([sym, mul]) => (
             <div key={sym} className="flex justify-between"><span>{sym}</span> <span>x{mul}</span></div>
           ))}
           <div className="mt-2 text-[10px] text-gray-500 border-t border-gray-600 pt-1">2 одинаковых = x1.5</div>
        </div>
      </div>

      <div className="text-center h-8">
         {message && <span className="text-xl font-bold text-yellow-500 animate-bounce">{message}</span>}
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl flex items-center gap-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 font-semibold uppercase">Ставка</label>
          <input 
            type="number" 
            value={bet} 
            onChange={(e) => setBet(Math.max(10, parseInt(e.target.value) || 0))}
            className="w-24 bg-transparent text-xl font-bold text-gray-900 dark:text-white outline-none border-b border-gray-300 dark:border-gray-600 focus:border-blue-500"
          />
        </div>

        <button 
          onClick={spin} 
          disabled={isSpinning}
          className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-bold rounded-full shadow-lg transform active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw size={20} className={isSpinning ? 'animate-spin' : ''} />
          КРУТИТЬ
        </button>
      </div>
    </div>
  );
};