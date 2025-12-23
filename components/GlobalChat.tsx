
import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, Bot } from 'lucide-react';
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
    // 1. Initial Load
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

    // 2. Realtime Subscription
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
      alert('Ошибка чата. Проверьте подключение Supabase.');
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[500px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-in slide-in-from-right-10">
      <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} />
          <h3 className="font-bold">Глобальный чат</h3>
        </div>
        <button onClick={onClose} className="hover:rotate-90 transition-transform">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50 dark:bg-black/20">
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-xs uppercase font-bold tracking-widest">Тишина в эфире...</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.username === username ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1 mb-1">
                <span className={`text-[10px] font-bold uppercase ${msg.username === username ? 'text-blue-500' : 'text-gray-500'}`}>
                  {msg.username}
                </span>
                <span className="text-[8px] text-gray-400">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`px-3 py-2 rounded-2xl text-sm max-w-[90%] shadow-sm ${
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
          placeholder="Напишите сообщение..."
          className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button type="submit" className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
