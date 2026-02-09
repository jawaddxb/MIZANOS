"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  type ReactNode,
} from "react";

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "mizan_auth_token";
const USER_KEY = "mizan_auth_user";

interface AuthProviderProps {
  children: ReactNode;
  apiBaseUrl?: string;
}

function AuthProvider({ children, apiBaseUrl = "/api" }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      fetch(`${apiBaseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((userData) => {
          setToken(storedToken);
          setUser(userData);
          document.cookie = `access_token=${storedToken}; path=/; max-age=86400; SameSite=Lax`;
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          document.cookie = "access_token=; path=/; max-age=0";
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ error: Error | null }> => {
    try {
      const res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return {
          error: new Error(body.detail || "Login failed"),
        };
      }

      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      document.cookie = `access_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
      setToken(data.access_token);
      setUser(data.user);

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Login failed") };
    }
  };

  const logout = async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    document.cookie = "access_token=; path=/; max-age=0";
    setToken(null);
    setUser(null);
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ error: Error | null }> => {
    try {
      const res = await fetch(`${apiBaseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return {
          error: new Error(body.detail || "Registration failed"),
        };
      }

      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error("Registration failed"),
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        signUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { AuthProvider, useAuth, AuthContext };
export type { AuthContextType, User };
