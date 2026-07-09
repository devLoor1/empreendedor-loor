import { useState, useEffect } from "react";
import { getToken, clearToken, getMe } from "@/services/api";

export type AuthUser = {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  image_url?: string;
};

type ApiUserResponse = AuthUser | { data?: AuthUser };

function unwrapUser(response: ApiUserResponse): AuthUser {
  return "data" in response && response.data ? response.data : response;
}

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
      .then((data) => setUser(unwrapUser(data as ApiUserResponse)))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleProfileUpdate = (event: Event) => {
      const detail = (event as CustomEvent<Partial<AuthUser>>).detail;
      setUser((current) => (current ? { ...current, ...detail } : current));
    };

    window.addEventListener("entrepreneur-profile-updated", handleProfileUpdate);

    return () => {
      window.removeEventListener("entrepreneur-profile-updated", handleProfileUpdate);
    };
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
