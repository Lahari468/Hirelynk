import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { ApiResponse } from "../types/index.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT 
  ? parseInt(import.meta.env.VITE_API_TIMEOUT, 10)
  : 30000;

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse>;

      if (axiosError.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }

      const apiError = axiosError.response?.data as ApiResponse | undefined;
      if (apiError) {
        return Promise.reject(apiError);
      }

      return Promise.reject({
        success: false,
        message: axiosError.message,
        error: {
          code: "REQUEST_ERROR",
          message: axiosError.message,
        },
      } as ApiResponse);
    }

    return Promise.reject(error);
  }
);

export const apiUtils = {
  get: <T = unknown>(
    url: string,
    config?: Record<string, unknown>
  ): Promise<ApiResponse<T>> => {
    return apiClient.get<ApiResponse<T>>(url, config) as unknown as Promise<ApiResponse<T>>;
  },

  post: <T = unknown>(
    url: string,
    data?: unknown,
    config?: Record<string, unknown>
  ): Promise<ApiResponse<T>> => {
    return apiClient.post<ApiResponse<T>>(url, data, config) as unknown as Promise<ApiResponse<T>>;
  },

  patch: <T = unknown>(
    url: string,
    data?: unknown,
    config?: Record<string, unknown>
  ): Promise<ApiResponse<T>> => {
    return apiClient.patch<ApiResponse<T>>(url, data, config) as unknown as Promise<ApiResponse<T>>;
  },

  put: <T = unknown>(
    url: string,
    data?: unknown,
    config?: Record<string, unknown>
  ): Promise<ApiResponse<T>> => {
    return apiClient.put<ApiResponse<T>>(url, data, config) as unknown as Promise<ApiResponse<T>>;
  },

  delete: <T = unknown>(
    url: string,
    config?: Record<string, unknown>
  ): Promise<ApiResponse<T>> => {
    return apiClient.delete<ApiResponse<T>>(url, config) as unknown as Promise<ApiResponse<T>>;
  },
};

export default apiClient;