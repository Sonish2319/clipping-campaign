"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { apiRequest } from "./api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userData: any) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchRole: (role: "creator" | "editor" | "superadmin") => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
  switchRole: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await apiRequest("/auth/me");
      setUser(data);
    } catch (e) {
      console.error("Failed to fetch user session", e);
      logout();
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (newToken: string, userData: any) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser({
      id: userData.user_id || userData.id,
      email: userData.email,
      full_name: userData.full_name,
      avatar_url: userData.avatar_url,
      roles: userData.roles || [],
      selected_role: userData.selected_role,
      is_active: true,
      is_verified: true,
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const switchRole = (newRole: "creator" | "editor" | "superadmin") => {
    if (user) {
      setUser({ ...user, selected_role: newRole });
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, logout, refreshUser, switchRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
