
import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, Plus, Trash2, Tag, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase.ts';
import { P2POrder, UserState, PortfolioItem } from '../types.ts';

interface P2PMarketProps {
  user: UserState;
  onClose: () => void;
  onRefreshUser: () => void;
}

export const P2PMarket: React.FC<P2PMarketProps> = ({ user, onClose, onRefreshUser }) => {
  const [orders, setOrders] = useState<P2POrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  
  // New Order State
  const [symbol, setSymbol] = useState(user.holdings[0]?.symbol || '');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase.from('p2p_market').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('p2p_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'p2p_market' }, fetchOrders).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    const prc = parseFloat(price);
    const holding = user.holdings.find(h => h.symbol === symbol);

    if (!holding || holding.quantity < qty || qty <= 0 || prc <= 0) {
      alert('Недостаточно акций или неверные данные!');
      return;
    }

    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    // 1. Create P2P order
    const { error } = await supabase.from('p2p_market').insert([{
      seller_id: session?.user.id,
      seller_name: user.username,
      symbol,
      quantity: qty,
      price: prc
    }]);

    if (!error) {
      // 2. Subtract from user locally (Optimistic)
      // Note: Real implementation should use a database transaction or RPC
      const newQty = holding.quantity - qty;
      await supabase.from('holdings').upsert({ user_id: session?.user.id, symbol, quantity: newQty }, { onConflict: 'user_id,symbol' });
      
      onRefreshUser();
      setShowCreate(false);
      setQuantity('');
      setPrice('');
    }
    setSubmitting(false);
  };

  const handleBuy = async (order: P2POrder) => {
    if (user.cash < order.price) {
      alert('Недостаточно наличных!');
      return;
    }

    if (order.seller_name === user.username) {
      alert('Вы не можете купить свой собственный лот!');
      return;
    }

    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    // 1. Delete order from market (Atomic check would be better)
    const { error: deleteError } = await supabase.from('p2p_market').delete().eq('id', order.id);

    if (deleteError) {
      alert('Этот лот уже купили!');
      setLoading(false);
      return;
    }

    // 2. Add shares to buyer
    const existing = user.holdings.find(h => h.symbol === order.symbol);
    await supabase.from('holdings').upsert({ 
      user_id: session?.user.id, 
      symbol: order.symbol, 
      quantity: (existing?.quantity || 0) + order.quantity,
      avg_cost: order.price / order.quantity
    }, { onConflict: 'user_id,symbol' });

    // 3. Update buyer's cash
    await supabase.from('profiles').update({ cash: user.cash - order.price }).eq('id', session?.user.id);

    // 4. Update seller's cash (Find seller first)
    const { data: sellerProfile } = await supabase.from('profiles').select('cash').eq('username', order.seller_name).single();
    if (sellerProfile) {
      await supabase.from('profiles').update({ cash: sellerProfile.cash + order.price }).eq('username', order.seller_name);
    }

    onRefreshUser();
    alert('Сделка успешно завершена!');
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[85vh] animate-in zoom-in-95">
        
        <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <ShoppingCart size={24} />
            <h2 className="text-xl font-black uppercase italic tracking-tighter">P2P MARKETPLACE</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex gap-2">
           <button 
            onClick={() => setShowCreate(!showCreate)}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
           >
             <Plus size={18} /> {showCreate ? 'Отмена' : 'Выставить на продажу'}
           </button>
           <button onClick={fetchOrders} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500"><Tag size={18} /></button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreateOrder} className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-900/30 space-y-4 animate-in slide-in-from-top-4">
             <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Акция</label>
                  <select 
                    value={symbol} 
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm"
                  >
                    {user.holdings.map(h => <option key={h.symbol} value={h.symbol}>{h.symbol} ({h.quantity})</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Кол-во</label>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm" />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Цена лота (₽)</label>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm" />
                </div>
             </div>
             <button disabled={submitting} type="submit" className="w-full py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-bold text-xs uppercase tracking-widest">
                {submitting ? 'Публикация...' : 'Опубликовать лот'}
             </button>
          </form>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gray-50/50 dark:bg-black/20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
               <Loader2 className="animate-spin" size={32} />
               <span className="text-[10px] font-black uppercase tracking-widest">Syncing Market...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 opacity-20 italic">Нет активных предложений</div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between group hover:border-indigo-500 transition-colors shadow-sm">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center font-black text-indigo-500">
                     {order.symbol}
                   </div>
                   <div>
                     <div className="text-sm font-black text-gray-900 dark:text-white uppercase">{order.quantity} Shares</div>
                     <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Seller: {order.seller_name}</div>
                   </div>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className="text-right">
                      <div className="text-lg font-black text-gray-900 dark:text-white">{order.price.toLocaleString()} ₽</div>
                      <div className="text-[10px] text-emerald-500 font-black uppercase">{(order.price / order.quantity).toFixed(2)}/шт</div>
                   </div>
                   {order.seller_name !== user.username ? (
                     <button 
                      onClick={() => handleBuy(order)}
                      className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-transform active:scale-90"
                     >
                       <ArrowRight size={20} />
                     </button>
                   ) : (
                     <button 
                      onClick={async () => {
                        await supabase.from('p2p_market').delete().eq('id', order.id);
                        // Return shares back to user locally/remotely
                        onRefreshUser();
                      }}
                      className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-colors"
                     >
                       <Trash2 size={20} />
                     </button>
                   )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
