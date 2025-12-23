
import React, { useState } from 'react';
import { UserState } from '../types.ts';
import { INITIAL_CASH } from '../constants.ts';
import { Lock, User, UserPlus, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase.ts';

interface AuthProps {
  onLogin: (user: UserState) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState(''); // Supabase prefers email or username + domain
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!password || (isLogin ? !username : (!username || !email))) {
      setError('Заполните все поля');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // We use email-like login for Supabase auth
        const loginEmail = username.includes('@') ? username : `${username}@tradesim.local`;
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: password,
        });

        if (authError) throw authError;

        // Fetch user profile from public.profiles table
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

        // Fetch holdings
        const { data: holdings } = await supabase
          .from('holdings')
          .select('*')
          .eq('user_id', data.user.id);

        onLogin({
          username: profile.username,
          cash: profile.cash,
          initialCash: profile.initial_cash,
          holdings: holdings || [],
          transactions: [], // Transactions could be fetched from a separate table later
          isBanned: profile.is_banned
        });

      } else {
        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: { username: username }
          }
        });

        if (signUpError) throw signUpError;
        if (!data.user) throw new Error('Ошибка регистрации');

        // Create profile in profiles table (Trigger should ideally handle this, but we do it manually for simplicity)
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
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">TradeSim AI</h1>
          <p className="text-blue-100 text-sm">{isLogin ? 'Войдите в свой портфель' : 'Создайте новый аккаунт'}</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="email@example.com"
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Никнейм</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-sm rounded-lg font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Загрузка...' : isLogin ? <><LogIn size={18} /> Войти</> : <><UserPlus size={18} /> Создать аккаунт</>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors"
            >
              {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
