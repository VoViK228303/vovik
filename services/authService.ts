import { User, UserPortfolio, Transaction } from '../types';

const USERS_KEY = 'tradesim_users';
const CURRENT_USER_KEY = 'tradesim_current_user';
const INITIAL_CASH = 1000;

// List of usernames that automatically get Admin privileges
const ADMIN_USERNAMES = ['admin', 'armen_lev'];

export const authService = {
  getUsers: (): Record<string, User> => {
    const usersStr = localStorage.getItem(USERS_KEY);
    const users = usersStr ? JSON.parse(usersStr) : {};
    
    // Migration and Role Enforcement
    let hasChanges = false;
    Object.keys(users).forEach(key => {
      const user = users[key];
      
      // 1. Ensure role exists
      if (!user.role) {
        user.role = 'user';
        hasChanges = true;
      }

      // 2. Force Admin role for specific usernames
      if (ADMIN_USERNAMES.includes(user.username.toLowerCase()) && user.role !== 'admin') {
        user.role = 'admin';
        hasChanges = true;
      }

      // 3. Ensure ban status exists
      if (typeof user.isBanned === 'undefined') {
        user.isBanned = false;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    
    return users;
  },

  saveUsers: (users: Record<string, User>) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  register: (username: string, password: string): { success: boolean; message: string; user?: User } => {
    const users = authService.getUsers();
    if (users[username]) {
      return { success: false, message: 'Пользователь с таким именем уже существует' };
    }

    const isAdmin = ADMIN_USERNAMES.includes(username.toLowerCase());

    const newUser: User = {
      username,
      password,
      role: isAdmin ? 'admin' : 'user',
      isBanned: false,
      portfolio: {
        cash: INITIAL_CASH,
        holdings: {},
        initialValue: INITIAL_CASH
      },
      transactions: []
    };

    users[username] = newUser;
    authService.saveUsers(users);
    authService.setCurrentUser(newUser);

    return { success: true, message: 'Регистрация успешна', user: newUser };
  },

  login: (username: string, password: string): { success: boolean; message: string; user?: User } => {
    const users = authService.getUsers(); // This calls the migration logic automatically
    const user = users[username];

    if (!user || user.password !== password) {
      return { success: false, message: 'Неверное имя пользователя или пароль' };
    }

    if (user.isBanned) {
        return { success: false, message: 'Ваш аккаунт заблокирован администратором.' };
    }
    
    authService.setCurrentUser(user);
    return { success: true, message: 'Вход выполнен', user };
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    if (!userStr) return null;
    
    const tempUser = JSON.parse(userStr);
    const users = authService.getUsers();
    const freshUser = users[tempUser.username] || null;
    
    // Security check: if user was banned while logged in
    if (freshUser && freshUser.isBanned) {
        authService.logout();
        return null;
    }
    
    // Update session storage if role changed (e.g. they became admin while logged out)
    if (freshUser && freshUser.role !== tempUser.role) {
       authService.setCurrentUser(freshUser);
    }
    
    return freshUser;
  },

  setCurrentUser: (user: User) => {
    const { password, ...safeUser } = user;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
  },

  updateUserData: (username: string, data: Partial<User>) => {
    const users = authService.getUsers();
    if (users[username]) {
      users[username] = { ...users[username], ...data };
      authService.saveUsers(users);
      const currentUser = authService.getCurrentUser();
      if (currentUser && currentUser.username === username) {
        authService.setCurrentUser(users[username]);
      }
    }
  },

  transferMoney: (fromUser: string, toUser: string, amount: number): { success: boolean; message: string } => {
    const users = authService.getUsers();
    
    if (!users[toUser]) {
      return { success: false, message: 'Пользователь-получатель не найден' };
    }
    
    if (users[fromUser].portfolio.cash < amount) {
      return { success: false, message: 'Недостаточно средств' };
    }

    users[fromUser].portfolio.cash -= amount;
    users[toUser].portfolio.cash += amount;

    authService.saveUsers(users);
    authService.setCurrentUser(users[fromUser]);

    return { success: true, message: `Перевод ${amount}₽ пользователю ${toUser} выполнен успешно` };
  },

  // --- Admin Methods ---

  toggleBan: (username: string): boolean => {
      const users = authService.getUsers();
      // Prevent banning admins
      if (users[username] && !ADMIN_USERNAMES.includes(username.toLowerCase())) {
          users[username].isBanned = !users[username].isBanned;
          authService.saveUsers(users);
          return true;
      }
      return false;
  },

  adminAddFunds: (username: string, amount: number): boolean => {
      const users = authService.getUsers();
      if (users[username]) {
          users[username].portfolio.cash += amount;
          // Adjust initial value so it doesn't look like pure profit
          users[username].portfolio.initialValue += amount; 
          authService.saveUsers(users);
          return true;
      }
      return false;
  },

  adminResetPassword: (username: string, newPass: string): boolean => {
      const users = authService.getUsers();
      if (users[username]) {
          users[username].password = newPass;
          authService.saveUsers(users);
          return true;
      }
      return false;
  },

  getAllGlobalTransactions: (): Transaction[] => {
      const users = authService.getUsers();
      let allTx: Transaction[] = [];
      Object.values(users).forEach(user => {
          const userTxs = user.transactions.map(t => ({...t, username: user.username}));
          allTx = [...allTx, ...userTxs];
      });
      // Sort by newest first
      return allTx.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
};