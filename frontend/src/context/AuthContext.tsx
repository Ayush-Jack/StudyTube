"use client";
// ─────────────────────────────────────────────────────────────────
// Auth context — wraps the app, provides user state + auth methods
// On app load: if token exists → calls /auth/me → sets user
// ─────────────────────────────────────────────────────────────────
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { isAuthenticated as checkAuth } from "@/lib/auth";
import * as authService from "@/services/authService";
import type { User, AuthResponse } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (name: string, email: string, password: string) => Promise<AuthResponse>;
  googleLogin: (idToken: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: if token exists → fetch current user
  useEffect(() => {
    async function loadUser() {
      if (!checkAuth()) {
        setIsLoading(false);
        return;
      }
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch {
        // Token invalid/expired — will be handled by interceptor
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setUser(response.user);
    return response;
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const response = await authService.register(name, email, password);
      setUser(response.user);
      return response;
    },
    []
  );

  const googleLogin = useCallback(async (idToken: string) => {
    const response = await authService.googleAuth(idToken);
    setUser(response.user);
    return response;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        googleLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
