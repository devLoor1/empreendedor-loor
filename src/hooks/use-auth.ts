import { useState, useEffect } from "react";
import { getToken, clearToken, getMe } from "@/services/api";

export type AuthUser = {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  image_url?: string;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((data) => setUser(data))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const signOut = () => {
    clearToken();
    setUser(null);
  };

  return { user, loading, setUser, signOut };
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
