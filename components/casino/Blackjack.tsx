import React, { useState, useEffect } from 'react';
import { PlayCircle, ShieldCheck, Hand } from 'lucide-react';

interface BlackjackProps {
  onUpdateCash: (amount: number) => void;
  balance: number;
}

type Card = { suit: string; rank: string; value: number };
type GameState = 'BETTING' | 'PLAYING' | 'DEALER_TURN' | 'FINISHED';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const Blackjack: React.FC<BlackjackProps> = ({ onUpdateCash, balance }) => {
  const [gameState, setGameState] = useState<GameState>('BETTING');
  const [bet, setBet] = useState(100);
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [message, setMessage] = useState('');

  // Generate and shuffle deck
  const createDeck = () => {
    let newDeck: Card[] = [];
    for (let suit of SUITS) {
      for (let rank of RANKS) {
        let value = parseInt(rank);
        if (['J', 'Q', 'K'].includes(rank)) value = 10;
        if (rank === 'A') value = 11;
        newDeck.push({ suit, rank, value });
      }
    }
    return newDeck.sort(() => Math.random() - 0.5);
  };

  const calculateScore = (hand: Card[]) => {
    let score = hand.reduce((acc, card) => acc + card.value, 0);
    let aces = hand.filter(card => card.rank === 'A').length;
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  };

  const startGame = () => {
    if (balance < bet) {
      setMessage('Недостаточно средств!');
      return;
    }
    onUpdateCash(-bet);
    const newDeck = createDeck();
    const pHand = [newDeck.pop()!, newDeck.pop()!];
    const dHand = [newDeck.pop()!, newDeck.pop()!];
    
    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setGameState('PLAYING');
    setMessage('');
    
    // Immediate Blackjack check
    if (calculateScore(pHand) === 21) {
        handleGameOver(pHand, dHand, 'BLACKJACK');
    }
  };

  const hit = () => {
    const newCard = deck.pop()!;
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    setDeck([...deck]); // Update deck ref

    if (calculateScore(newHand) > 21) {
      handleGameOver(newHand, dealerHand, 'BUST');
    }
  };

  const stand = () => {
    setGameState('DEALER_TURN');
    let currentDealerHand = [...dealerHand];
    let currentDeck = [...deck];
    
    // Dealer logic: hit until 17
    while (calculateScore(currentDealerHand) < 17) {
      currentDealerHand.push(currentDeck.pop()!);
    }
    
    setDealerHand(currentDealerHand);
    handleGameOver(playerHand, currentDealerHand, 'COMPARE');
  };

  const handleGameOver = (pHand: Card[], dHand: Card[], reason: 'BUST' | 'BLACKJACK' | 'COMPARE') => {
    setGameState('FINISHED');
    const pScore = calculateScore(pHand);
    const dScore = calculateScore(dHand);

    if (reason === 'BUST') {
      setMessage('Перебор! Вы проиграли.');
    } else if (reason === 'BLACKJACK') {
       if (dScore === 21) { // Push if both have blackjack
           onUpdateCash(bet);
           setMessage('Ничья (Push)!');
       } else {
           const win = Math.floor(bet * 2.5); // 3:2 payout usually means Total Return 2.5x bet
           onUpdateCash(win);
           setMessage(`BLACKJACK! Вы выиграли ${win - bet} ₽`);
       }
    } else {
      if (dScore > 21) {
        onUpdateCash(bet * 2);
        setMessage('Дилер перебрал! Вы выиграли.');
      } else if (pScore > dScore) {
        onUpdateCash(bet * 2);
        setMessage('Вы выиграли!');
      } else if (pScore < dScore) {
        setMessage('Дилер выиграл.');
      } else {
        onUpdateCash(bet);
        setMessage('Ничья (Push).');
      }
    }
  };

  const renderCard = (card: Card, hidden: boolean = false) => (
    <div className={`
      w-16 h-24 sm:w-20 sm:h-28 rounded-lg shadow-md border border-gray-200 flex flex-col items-center justify-center relative
      ${hidden ? 'bg-blue-800' : 'bg-white'}
    `}>
      {!hidden && (
        <>
          <span className={`absolute top-1 left-1 font-bold text-lg ${['♥', '♦'].includes(card.suit) ? 'text-red-600' : 'text-black'}`}>{card.rank}</span>
          <span className={`text-3xl ${['♥', '♦'].includes(card.suit) ? 'text-red-600' : 'text-black'}`}>{card.suit}</span>
          <span className={`absolute bottom-1 right-1 font-bold text-lg rotate-180 ${['♥', '♦'].includes(card.suit) ? 'text-red-600' : 'text-black'}`}>{card.rank}</span>
        </>
      )}
      {hidden && <div className="w-full h-full border-2 border-blue-400 rounded-lg opacity-20 bg-pattern" />}
    </div>
  );

  return (
    <div className="flex flex-col items-center p-4 space-y-6 w-full">
      
      {/* Table Area */}
      <div className="w-full bg-emerald-800 rounded-3xl p-6 sm:p-10 shadow-inner relative min-h-[400px] flex flex-col justify-between border-8 border-yellow-900/30">
        
        {/* Dealer */}
        <div className="flex flex-col items-center">
          <div className="text-emerald-200 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
            <ShieldCheck size={16} /> Дилер {gameState === 'FINISHED' && `(${calculateScore(dealerHand)})`}
          </div>
          <div className="flex gap-2">
            {dealerHand.map((card, i) => (
              <div key={i} className="transform transition-transform hover:-translate-y-2">
                 {renderCard(card, i === 0 && gameState === 'PLAYING')}
              </div>
            ))}
            {dealerHand.length === 0 && <div className="w-20 h-28 border-2 border-dashed border-emerald-600 rounded-lg"></div>}
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           {message && <div className="bg-black/50 backdrop-blur-md text-white px-6 py-3 rounded-xl text-xl font-bold animate-in zoom-in">{message}</div>}
        </div>

        {/* Player */}
        <div className="flex flex-col items-center">
          <div className="flex gap-2 mb-2">
             {playerHand.map((card, i) => (
               <div key={i} className="transform transition-transform hover:-translate-y-2">
                 {renderCard(card)}
               </div>
             ))}
             {playerHand.length === 0 && <div className="w-20 h-28 border-2 border-dashed border-emerald-600 rounded-lg"></div>}
          </div>
          <div className="text-emerald-200 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
             Игрок {playerHand.length > 0 && `(${calculateScore(playerHand)})`}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-4">
        {gameState === 'BETTING' || gameState === 'FINISHED' ? (
           <div className="flex items-end gap-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
             <div>
                <label className="text-xs text-gray-500 font-semibold uppercase">Ставка</label>
                <input 
                  type="number" 
                  value={bet} 
                  onChange={(e) => setBet(Math.max(10, parseInt(e.target.value) || 0))}
                  className="w-24 block bg-transparent text-xl font-bold text-gray-900 dark:text-white outline-none border-b border-gray-300 dark:border-gray-600 focus:border-blue-500"
                />
             </div>
             <button 
                onClick={startGame}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
             >
               <PlayCircle size={20} /> Играть
             </button>
           </div>
        ) : (
          <div className="flex gap-4">
             <button 
                onClick={hit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg flex items-center gap-2"
             >
               <Hand size={20} /> Взять (Hit)
             </button>
             <button 
                onClick={stand}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg flex items-center gap-2"
             >
               <ShieldCheck size={20} /> Хватит (Stand)
             </button>
          </div>
        )}
      </div>
    </div>
  );
};