// ─────────────────────────────────────────────────────────────────
// Axios instance — auto-attaches JWT, handles 401 refresh/redirect
// ─────────────────────────────────────────────────────────────────
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getAccessToken, clearTokens } from "./auth";
import type { ApiResponse } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ── Request interceptor: attach Bearer token ─────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: unwrap data, handle 401 ────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || error.message || "Something went wrong";

    if (status === 401) {
      clearTokens();
      // Redirect to login (only on client-side)
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
