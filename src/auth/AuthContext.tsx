import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { TOKEN_STORAGE_KEY, setUnauthorizedHandler } from "@/api/client";
import {
  fetchCurrentUser,
  loginWithGoogle,
  loginWithPassword,
  register as registerRequest,
  type CurrentUser,
  type LoginPayload,
  type RegisterPayload,
} from "@/api/auth";

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  loginGoogle: (idToken: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  hasGroup: (groupName: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function storeToken(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const current = await fetchCurrentUser();
      setUser(current);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearToken();
      setUser(null);
    });
    loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const token = await loginWithPassword(payload);
      storeToken(token.access_token);
      await loadUser();
    },
    [loadUser],
  );

  const loginGoogle = useCallback(
    async (idToken: string) => {
      const token = await loginWithGoogle(idToken);
      storeToken(token.access_token);
      await loadUser();
    },
    [loadUser],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      await registerRequest(payload);
      await login({ email: payload.email, password: payload.password });
    },
    [login],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const hasGroup = useCallback(
    (groupName: string) => {
      return user?.groups.some((g) => g.name === groupName) ?? false;
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      loginGoogle,
      register,
      logout,
      refresh: loadUser,
      hasGroup,
    }),
    [user, loading, login, loginGoogle, register, logout, loadUser, hasGroup],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }
  return ctx;
}
