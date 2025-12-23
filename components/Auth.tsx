import React, { useState } from 'react';
import { UserState } from '../types.ts';
import { INITIAL_CASH } from '../constants.ts';
import { Lock, User, UserPlus, LogIn } from 'lucide-react';

interface AuthProps {
  onLogin: (user: UserState) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Заполните все поля');
      return;
    }

    const usersStr = localStorage.getItem('tradeSimUsers');
    const users: Record<string, any> = usersStr ? JSON.parse(usersStr) : {};

    if (isLogin) {
      // Специальная проверка для Админов (Hardcoded credentials)
      // Если введены верные данные админа, мы пускаем его, даже если аккаунта нет в базе (создаем его на лету)
      if ((username === 'Armen_LEV' && password === 'bot228303') || 
          (username === 'admin' && password === 'armen2009')) {
          
          let adminUser = users[username];
          
          // Если это первый вход админа, создаем ему профиль
          if (!adminUser) {
             const adminState: UserState = {
                username,
                cash: INITIAL_CASH, // Админы начинают с той же суммой, но могут накрутить себе через панель
                holdings: [],
                transactions: [],
                initialCash: INITIAL_CASH,
                isBanned: false
             };
             adminUser = { password, state: adminState };
             users[username] = adminUser;
             localStorage.setItem('tradeSimUsers', JSON.stringify(users));
          }

          onLogin(adminUser.state);
          return;
      }

      // Обычный вход для пользователей
      const user = users[username];
      if (user && user.password === password) {
        if (user.state.isBanned) {
          setError('ЭТОТ АККАУНТ ЗАБЛОКИРОВАН АДМИНИСТРАЦИЕЙ');
          return;
        }
        onLogin(user.state);
      } else {
        setError('Неверное имя пользователя или пароль');
      }
    } else {
      if (users[username]) {
        setError('Пользователь с таким именем уже существует');
        return;
      }

      // Запрет на регистрацию никнеймов админов обычным путем
      if (username.toLowerCase() === 'admin' || username.toLowerCase() === 'armen_lev') {
         setError('Это имя пользователя недоступно для регистрации');
         return;
      }

      const newUserState: UserState = {
        username,
        cash: INITIAL_CASH,
        holdings: [],
        transactions: [],
        initialCash: INITIAL_CASH,
        isBanned: false
      };

      // Save user wrapper with password
      const newUser = {
        password,
        state: newUserState
      };

      users[username] = newUser;
      localStorage.setItem('tradeSimUsers', JSON.stringify(users));
      onLogin(newUserState);
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
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Имя пользователя</label>
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
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
            >
              {isLogin ? <><LogIn size={18} /> Войти</> : <><UserPlus size={18} /> Создать аккаунт</>}
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