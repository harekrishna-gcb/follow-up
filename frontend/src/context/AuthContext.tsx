import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AUTH_EXPIRED_EVENT, clearAuth, getStoredUser, saveAuth, saveUser } from '../api/client';
import { loginRequest, logoutRequest, meRequest } from '../api/auth';
import { persister } from '../api/queryClient';
import type { SessionUser } from '../types';

interface AuthValue {
  user: SessionUser | null;
  isAdmin: boolean;
  login: (name: string, pin: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

function clearSessionStorage() {
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<SessionUser | null>(() => getStoredUser());

  /** Wipes cached data so the next person on this phone never sees it. */
  const resetCache = useCallback(() => {
    qc.clear();
    void persister.removeClient();
    clearSessionStorage();
  }, [qc]);

  const login = useCallback(
    async (name: string, pin: string) => {
      const res = await loginRequest(name.trim(), pin);
      resetCache();
      saveAuth(res.token, res.volunteer);
      setUser(res.volunteer);
      return res.volunteer;
    },
    [resetCache],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      /* the session may already be gone — log out locally anyway */
    }
    clearAuth();
    resetCache();
    setUser(null);
  }, [resetCache]);

  // The API client fires this when the server says the session is invalid.
  useEffect(() => {
    const onExpired = () => {
      resetCache();
      setUser(null);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [resetCache]);

  // Refresh name/role once per app start (e.g. after an admin changed it).
  useEffect(() => {
    if (!getStoredUser()) return;
    meRequest()
      .then((u) => {
        saveUser(u);
        setUser(u);
      })
      .catch(() => undefined);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ user, isAdmin: user?.role === 'admin', login, logout }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
