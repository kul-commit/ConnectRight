import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

// If you have a real API, replace BASE_URL and the fetch calls accordingly
const BASE_URL = import.meta.env.VITE_API_URL || "/api";

type AuthContextType = {
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  addToUserHistory: (meetingCode: string) => Promise<void>;
  getHistoryOfUser: () => Promise<Array<{ meetingCode: string; date: string }>>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // simulate boot
    setLoading(false);
  }, []);

  const login = useCallback((newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
  }, []);

  const addToUserHistory = useCallback(
    async (meetingCode: string) => {
      if (!token) return;
      await fetch(`${BASE_URL}/history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ meetingCode }),
      }).catch(() => {});
    },
    [token]
  );

  const getHistoryOfUser = useCallback(async () => {
    if (!token) return [];
    const res = await fetch(`${BASE_URL}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => undefined);
    if (!res || !res.ok) return [];
    const data = await res.json();
    // normalize
    return (data?.history ?? []) as Array<{
      meetingCode: string;
      date: string;
    }>;
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: !!token,
      loading,
      login,
      logout,
      addToUserHistory,
      getHistoryOfUser,
    }),
    [token, loading, login, logout, addToUserHistory, getHistoryOfUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
