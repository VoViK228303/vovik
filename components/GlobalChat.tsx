
import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, Bot, User } from 'lucide-react';
import { supabase } from '../lib/supabase.ts';
import { Message } from '../types.ts';

interface GlobalChatProps {
  username: string;
  onClose: () => void;
}

export const GlobalChat: React.FC<GlobalChatProps> = ({ username, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      if (data) setMessages(data);
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    };

    fetchMessages();

    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        setTimeout(scrollToBottom, 100);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = newMessage;
    setNewMessage('');

    const { error } = await supabase.from('messages').insert([
      { username, text: msg }
    ]);

    if (error) {
      console.error('Error sending message:', error);
      alert('Ошибка чата. Возможно, не настроены таблицы.');
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[500px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-300">
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-4 flex justify-between items-center text-white shadow-lg">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
             <MessageSquare size={18} />
          </div>
          <div>
            <h3 className="font-black uppercase text-xs tracking-tighter">Global Trade Chat</h3>
            <div className="flex items-center gap-1">
               <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
               <span className="text-[8px] font-bold uppercase opacity-70">Realtime Active</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-all">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50 dark:bg-black/40">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-30">
             <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
             <span className="text-[10px] font-black uppercase">Syncing...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
             <p className="text-gray-300 dark:text-gray-700 text-3xl font-black italic">SILENCE</p>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Будьте первым, кто напишет</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.username === username ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className={`text-[9px] font-black uppercase tracking-tighter ${msg.username === username ? 'text-blue-500' : 'text-gray-500'}`}>
                  {msg.username}
                </span>
                <span className="text-[7px] text-gray-400 font-bold">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[85%] shadow-sm transition-all hover:scale-[1.02] ${
                msg.username === username 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'
              }`}>
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Ваше сообщение..."
          className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
        <button type="submit" className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all active:scale-90 shadow-lg shadow-blue-500/20">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
