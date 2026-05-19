"use client";
import { create } from "zustand";
import { MOCK_USER } from "@/lib/mock-data";

interface AuthStore {
  user: typeof MOCK_USER | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  hasOnboarded: boolean;
  setOnboarded: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  hasOnboarded: false,
  login: (email: string, _password: string) => {
    // Mock auth — any email/password works
    if (email) {
      set({ user: MOCK_USER, isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => set({ user: null, isAuthenticated: false, hasOnboarded: false }),
  setOnboarded: () => set({ hasOnboarded: true }),
}));

interface SidebarStore {
  isExpanded: boolean;
  isOverlay: boolean;
  toggle: () => void;
  setExpanded: (v: boolean) => void;
  setOverlay: (v: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isExpanded: true,
  isOverlay: false,
  toggle: () => set((s) => ({ isExpanded: !s.isExpanded })),
  setExpanded: (v) => set({ isExpanded: v }),
  setOverlay: (v) => set({ isOverlay: v, isExpanded: false }),
}));

interface CategoryStore {
  activeCategory: string;
  setActiveCategory: (c: string) => void;
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  activeCategory: "All",
  setActiveCategory: (c) => set({ activeCategory: c }),
}));
