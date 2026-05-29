import { adminMeHttp, http } from "./http";
import axios from "axios";

export type AdminMeUser = {
  id: number;
  email: string;
  role: string;
};

export type AdminMeResponse = { user: AdminMeUser | null };

export type LoginRequest = { email: string; password: string };
export type LoginResponse = { token: string; username: string };
export type ForgotPasswordRequest = { email: string };
export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  try {
    const { data } = await http.post<Record<string, unknown>>("/auth/login", {
      email: payload.email,
      password: payload.password,
    });

    const token =
      (typeof data.token === "string" && data.token) ||
      (typeof data.accessToken === "string" && data.accessToken) ||
      (typeof data.jwt === "string" && data.jwt) ||
      "";

    const username =
      (typeof data.username === "string" && data.username) ||
      (typeof (data.user as { username?: unknown } | undefined)?.username === "string"
        ? ((data.user as { username: string }).username ?? "")
        : "") ||
      (typeof (data.user as { email?: unknown } | undefined)?.email === "string"
        ? ((data.user as { email: string }).email ?? "")
        : "") ||
      payload.email;

    if (!token) {
      throw new Error("Login response missing token");
    }

    return { token, username };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        (error.response?.data as { error?: string; message?: string } | undefined)?.error ||
        (error.response?.data as { error?: string; message?: string } | undefined)?.message ||
        error.message;
      throw new Error(message || "Login failed");
    }
    throw error;
  }
}

export async function getAdminMe(): Promise<AdminMeResponse> {
  const { data } = await adminMeHttp.get<AdminMeResponse>("/me");
  return data;
}

export async function forgotPassword(payload: ForgotPasswordRequest): Promise<{ message: string }> {
  const { data } = await http.post<{ message: string }>("/auth/forgot-password", payload);
  return data;
}

export async function changePassword(payload: ChangePasswordRequest): Promise<{ message: string }> {
  const { data } = await http.post<{ message: string }>("/auth/change-password", payload);
  return data;
}
