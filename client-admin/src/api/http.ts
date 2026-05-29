import axios, { type InternalAxiosRequestConfig } from "axios";

const baseURL = import.meta.env.VITE_ADMIN_API_BASE_URL ?? "/v1/admin";
const adminMeBaseURL = import.meta.env.VITE_ADMIN_ME_API_BASE_URL ?? "/admin";

function attachAuthToken(config: InternalAxiosRequestConfig) {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

export const http = axios.create({
  baseURL,
  timeout: 10000,
});

export const adminMeHttp = axios.create({
  baseURL: adminMeBaseURL,
  timeout: 10000,
});

http.interceptors.request.use(attachAuthToken);
adminMeHttp.interceptors.request.use(attachAuthToken);
