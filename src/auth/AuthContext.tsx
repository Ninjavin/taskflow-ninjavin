import { useMemo, useState } from 'react';
import { AuthContext } from './context';
import { api } from '../lib/api';
import type { AuthContextValue, AuthState } from './context';

const AUTH_STORAGE_KEY = 'taskflow-auth';

function readStoredAuth(): AuthState {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return { token: null, user: null };
  try {
    const parsed = JSON.parse(raw) as AuthState;
    return parsed;
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => readStoredAuth());

  const persistAuth = (nextState: AuthState) => {
    setAuthState(nextState);
    if (!nextState.token) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextState));
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      ...authState,
      isAuthenticated: Boolean(authState.token && authState.user),
      async login(email, password) {
        const response = await api.login(email, password);
        persistAuth({ token: response.token, user: response.user });
      },
      async register(name, email, password) {
        const response = await api.register(name, email, password);
        persistAuth({ token: response.token, user: response.user });
      },
      logout() {
        persistAuth({ token: null, user: null });
      },
    }),
    [authState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
