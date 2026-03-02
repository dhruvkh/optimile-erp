// ============================================================
// Optimile ERP – Unified Auth Context
// ============================================================
// Single auth system that controls access to ALL modules.
// Supports: multi-tenant, RBAC, module-level gating.
// ============================================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, ERPModule, Tenant } from '../types';
import { MOCK_USERS, MOCK_TENANTS } from './mockData';

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => void;
  hasPermission: (requiredPermissions: string[]) => boolean;
  hasModuleAccess: (module: ERPModule) => boolean;
  switchTenant: (tenantId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('optimile_erp_user') || sessionStorage.getItem('optimile_erp_user');
    const storedTenant = localStorage.getItem('optimile_erp_tenant') || sessionStorage.getItem('optimile_erp_tenant');
    if (storedUser && storedTenant) {
      try {
        setUser(JSON.parse(storedUser));
        setTenant(JSON.parse(storedTenant));
      } catch (e) {
        localStorage.removeItem('optimile_erp_user');
        localStorage.removeItem('optimile_erp_tenant');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean): Promise<void> => {
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const foundUser = MOCK_USERS.find(
          u => u.email.toLowerCase() === email.toLowerCase() && (u as any).password === password
        );

        if (foundUser) {
          const { password: _, ...userWithoutPassword } = foundUser as any;
          const userTenant = MOCK_TENANTS.find(t => t.id === foundUser.tenantId);

          if (!userTenant || userTenant.status !== 'active') {
            setError('Your organization account is not active.');
            setLoading(false);
            reject(new Error('Tenant not active'));
            return;
          }

          setUser(userWithoutPassword);
          setTenant(userTenant);

          const storage = rememberMe ? localStorage : sessionStorage;
          storage.setItem('optimile_erp_user', JSON.stringify(userWithoutPassword));
          storage.setItem('optimile_erp_tenant', JSON.stringify(userTenant));

          setLoading(false);
          resolve();
        } else {
          setLoading(false);
          setError('Invalid email or password');
          reject(new Error('Invalid credentials'));
        }
      }, 600);
    });
  };

  const logout = () => {
    setUser(null);
    setTenant(null);
    localStorage.removeItem('optimile_erp_user');
    localStorage.removeItem('optimile_erp_tenant');
    sessionStorage.removeItem('optimile_erp_user');
    sessionStorage.removeItem('optimile_erp_tenant');
  };

  const hasPermission = (requiredPermissions: string[]): boolean => {
    if (!user) return false;
    if (user.permissions.includes('all')) return true;
    return requiredPermissions.some(p => user.permissions.includes(p));
  };

  const hasModuleAccess = (module: ERPModule): boolean => {
    if (!user || !tenant) return false;
    // Tenant must have the module licensed
    if (!tenant.modules.includes(module)) return false;
    // User must have the module in their access list (or have 'all' permissions)
    if (user.permissions.includes('all')) return true;
    return user.modules.includes(module);
  };

  const switchTenant = (tenantId: string) => {
    const newTenant = MOCK_TENANTS.find(t => t.id === tenantId);
    if (newTenant) setTenant(newTenant);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        isAuthenticated: !!user,
        loading,
        error,
        login,
        logout,
        hasPermission,
        hasModuleAccess,
        switchTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
