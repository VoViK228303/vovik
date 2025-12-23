
import React, { useState } from 'react';
import { UserState } from '../types.ts';
import { INITIAL_CASH } from '../constants.ts';
import { Lock, User, UserPlus, LogIn, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase.ts';

interface AuthProps {
  onLogin: (user: UserState) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to get consistent email from username/email input
  const getEmail = (input: string) => {
    if (input.includes('@')) return input.toLowerCase();
    return `${input.toLowerCase().trim()}@tradesim.local`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const targetEmail = getEmail(username);

    if (!password || !username) {
      setError('Заполните все поля');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: password,
        });

        if (authError) throw authError;

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;
        if (profile.is_banned) {
          await supabase.auth.signOut();
          throw new Error('АККАУНТ ЗАБЛОКИРОВАН');
        }

        const { data: holdings } = await supabase
          .from('holdings')
          .select('*')
          .eq('user_id', data.user.id);

        onLogin({
          username: profile.username,
          cash: profile.cash,
          initialCash: profile.initial_cash,
          holdings: holdings || [],
          transactions: [],
          isBanned: profile.is_banned
        });

      } else {
        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: targetEmail,
          password: password,
          options: {
            data: { username: username }
          }
        });

        if (signUpError) throw signUpError;
        if (!data.user) throw new Error('Ошибка регистрации. Возможно, никнейм занят.');

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { id: data.user.id, username: username, cash: INITIAL_CASH, initial_cash: INITIAL_CASH }
          ]);

        if (profileError) throw profileError;

        onLogin({
          username: username,
          cash: INITIAL_CASH,
          initialCash: INITIAL_CASH,
          holdings: [],
          transactions: [],
          isBanned: false
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message === 'Invalid login credentials' ? 'Неверный логин или пароль' : err.message || 'Ошибка аутентификации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="bg-blue-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <LogIn size={100} />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 italic tracking-tighter">TRADESIM AI</h1>
          <p className="text-blue-100 text-sm font-medium uppercase tracking-widest">{isLogin ? 'Вход в терминал' : 'Регистрация инвестора'}</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Никнейм или Email</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Ваш никнейм"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-xs rounded-xl font-bold border border-rose-100 dark:border-rose-900/30 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                 {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isLogin ? (
                <><LogIn size={18} /> Войти в систему</>
              ) : (
                <><UserPlus size={18} /> Создать аккаунт</>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-xs font-bold text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
            >
              {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
