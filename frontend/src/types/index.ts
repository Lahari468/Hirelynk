export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "CANDIDATE" | "RECRUITER" | "ADMIN";
  createdAt: string;
}