
import React, { useState, useEffect } from 'react';
import { Stock, NewsItem, Transaction } from '../types.ts';
import { ShieldAlert, TrendingUp, Users, Newspaper, X, Ban, CheckCircle, Search, ScrollText, Plus, Trash2, List, Activity, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase.ts';

interface AdminPanelProps {
  onClose: () => void;
  stocks: Stock[];
  onRefreshAll: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, stocks, onRefreshAll }) => {
  const [activeTab, setActiveTab] = useState<'MARKET' | 'USERS'>('USERS');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('cash', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleBan = async (profile: any) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !profile.is_banned })
      .eq('id', profile.id);
    
    if (!error) {
      loadUsers();
      onRefreshAll();
    }
  };

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-gray-900 text-gray-100 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="bg-gray-800 p-6 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={24} />
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Admin Terminal</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>

        <div className="flex border-b border-gray-700 bg-gray-800/30">
          <button 
            onClick={() => setActiveTab('USERS')}
            className={`flex-1 py-4 font-bold text-xs uppercase tracking-widest ${activeTab === 'USERS' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}
          >
            Users Management
          </button>
          <button 
             onClick={() => setActiveTab('MARKET')}
             className={`flex-1 py-4 font-bold text-xs uppercase tracking-widest ${activeTab === 'MARKET' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}
          >
            Market Control
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-black/20">
          {activeTab === 'USERS' && (
            <div className="space-y-4">
               <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Find user..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${u.is_banned ? 'bg-red-900/50 text-red-500' : 'bg-blue-900/50 text-blue-400'}`}>
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-2">
                              {u.username}
                              {u.is_banned && <span className="text-[8px] bg-red-600 text-white px-1 py-0.5 rounded uppercase">Banned</span>}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">{u.cash.toLocaleString()} ₽</div>
                          </div>
                       </div>
                       <button 
                        onClick={() => toggleBan(u)}
                        className={`p-3 rounded-xl transition-all ${u.is_banned ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                       >
                         {u.is_banned ? <CheckCircle size={18} /> : <Ban size={18} />}
                       </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'MARKET' && (
            <div className="text-center py-20 text-gray-500 italic">
              Функции управления рынком будут доступны в следующем обновлении.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
