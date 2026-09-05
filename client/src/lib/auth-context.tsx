'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiFetch, apiPost } from './api';
import { clearToken, readToken, writeToken } from './auth-storage';
import { loginResponseSchema, meResponseSchema, type User } from './schemas';

type Status = 'loading' | 'authenticated' | 'unauthenticated';

type AuthValue = {
  status: Status;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);

  // A stored token proves nothing on its own, so it is exchanged for the real
  // user on load. That also catches tokens revoked while the tab was closed.
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      if (!readToken()) {
        setStatus('unauthenticated');
        return;
      }

      try {
        const { user: me } = meResponseSchema.parse(await apiFetch<unknown>('/api/auth/me'));

        if (!cancelled) {
          setUser(me);
          setStatus('authenticated');
        }
      } catch {
        clearToken();

        if (!cancelled) {
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    };

    void restore();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = loginResponseSchema.parse(
      await apiPost<unknown>('/api/auth/login', { email, password }),
    );

    writeToken(result.token);
    setUser(result.user);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiPost('/api/auth/logout');
    } finally {
      clearToken();
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ status, user, signIn, signOut }),
    [status, user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthValue => {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
};
