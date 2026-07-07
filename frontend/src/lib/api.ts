// ─────────────────────────────────────────────────────────────────
// Axios instance — auto-attaches JWT, handles 401 refresh/redirect
// ─────────────────────────────────────────────────────────────────
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "./auth";
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

// ── Response interceptor: auto-refresh on 401, handle errors ─────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

function processQueue(error: Error | null, token: string | null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const message =
      error.response?.data?.message || error.message || "Something went wrong";

    // Only attempt refresh on 401 (not 403), and only once per request
    if (status === 401 && !originalRequest._retry) {
      const refreshToken = getRefreshToken();

      // No refresh token available — go to login
      if (!refreshToken) {
        clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
        return Promise.reject(new Error(message));
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint directly (bypass interceptors)
        const res = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );
        const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data;
        saveTokens(newAccess, newRefresh);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        processQueue(null, newAccess);
        return api(originalRequest);
      } catch {
        // Refresh failed — tokens are invalid, go to login
        processQueue(new Error("Session expired"), null);
        clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
        return Promise.reject(new Error("Session expired. Please log in again."));
      } finally {
        isRefreshing = false;
      }
    }

    // 403 Forbidden — not a token issue, just deny access
    if (status === 403) {
      return Promise.reject(new Error(message));
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
