import axios from "axios";

import { getBackendToken } from "@/lib/api/backend-token";

// Base Axios
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  config.headers.Authorization = `Bearer ${await getBackendToken()}`;
  return config;
});
