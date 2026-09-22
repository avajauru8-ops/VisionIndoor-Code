import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';

export interface User {
  id: number;
  nome: string;
  email: string;
  nivel: 'admin' | 'agencia';
  plano?: 'gratis' | 'pago';
  limite_tvs?: number;
  status_licenca?: 'ativa' | 'expirada';
  validade_licenca?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiFetch('/api/auth/me');
      if (data && !data.error) {
        setUser(prev => {
          const updated = { ...prev, ...data } as User;
          localStorage.setItem('user', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token, fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, fetchProfile, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
