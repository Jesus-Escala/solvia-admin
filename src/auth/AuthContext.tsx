import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, tokenStorage } from '../lib/api';
import type { AdminAuthResponse, PlatformAdmin } from '../lib/types';

interface AuthContextValue {
  admin: PlatformAdmin | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [admin, setAdmin] = useState<PlatformAdmin | null>(() =>
    tokenStorage.getAccessToken() ? tokenStorage.getUser() : null,
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    queryClient.clear();
    setAdmin(null);
  }, [queryClient]);

  useEffect(() => {
    api.setUnauthorizedHandler(logout);
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      admin,
      isAuthenticated: admin !== null,
      login: async (email, password) => {
        const session = await api.public.post<AdminAuthResponse>('/admin/auth/login', {
          email,
          password,
        });
        tokenStorage.setTokens(session.accessToken, session.refreshToken);
        tokenStorage.setUser(session.admin);
        queryClient.clear();
        setAdmin(session.admin);
      },
      logout,
    }),
    [admin, logout, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with its provider
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
