import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { MOCK_USERS } from '../constants';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => void;
  hasPermission: (requiredPermissions: string[]) => boolean;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for persisted session
    const storedUser = localStorage.getItem('optimile_user') || sessionStorage.getItem('optimile_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem('optimile_user');
        sessionStorage.removeItem('optimile_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean): Promise<void> => {
    setLoading(true);
    setError(null);

    // Simulate API network delay
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

        if (foundUser) {
          // Destructure to remove password from state
          const { password: _, ...userWithoutPassword } = foundUser;
          setUser(userWithoutPassword);
          
          const storage = rememberMe ? localStorage : sessionStorage;
          storage.setItem('optimile_user', JSON.stringify(userWithoutPassword));
          
          setLoading(false);
          resolve();
        } else {
          setLoading(false);
          setError('Invalid email or password');
          reject(new Error('Invalid email or password'));
        }
      }, 800);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('optimile_user');
    sessionStorage.removeItem('optimile_user');
  };

  const hasPermission = (requiredPermissions: string[]) => {
    if (!user) return false;
    // 'all' permission grants access to everything
    if (user.permissions.includes('all')) return true;
    // Check if user has at least one of the required permissions
    return requiredPermissions.some(permission => user.permissions.includes(permission));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, hasPermission, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
