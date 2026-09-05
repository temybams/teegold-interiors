'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiFetch, apiPost } from './api';
import { meResponseSchema, sessionResponseSchema, type User } from './schemas';

type Status = 'loading' | 'authenticated' | 'unauthenticated';

type AuthValue = {
  status: Status;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  acceptInvite: (token: string, password: string) => Promise<void>;
  completeReset: (token: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

const applySession = async (
  path: string,
  body: unknown,
  setUser: (user: User) => void,
  setStatus: (status: Status) => void,
): Promise<void> => {
  const result = sessionResponseSchema.parse(await apiPost<unknown>(path, body));
  setUser(result.user);
  setStatus('authenticated');
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      try {
        const { user: me } = meResponseSchema.parse(await apiFetch<unknown>('/api/auth/me'));

        if (!cancelled) {
          setUser(me);
          setStatus('authenticated');
        }
      } catch {
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

  // Sliding session: a new 12-hour cookie every 30 minutes, and again when the tab returns.
  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    const refresh = () => {
      void apiPost('/api/auth/refresh').catch(() => undefined);
    };

    const interval = window.setInterval(refresh, 30 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [status]);

  const signIn = useCallback(
    (email: string, password: string) =>
      applySession('/api/auth/login', { email, password }, setUser, setStatus),
    [],
  );

  const acceptInvite = useCallback(
    (token: string, password: string) =>
      applySession('/api/auth/invites/accept', { token, password }, setUser, setStatus),
    [],
  );

  const completeReset = useCallback(
    (token: string, password: string) =>
      applySession('/api/auth/password-reset/confirm', { token, password }, setUser, setStatus),
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await apiPost('/api/auth/logout');
    } finally {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ status, user, signIn, acceptInvite, completeReset, signOut }),
    [status, user, signIn, acceptInvite, completeReset, signOut],
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
