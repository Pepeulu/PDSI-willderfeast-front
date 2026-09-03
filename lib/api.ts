import axios from "axios";

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface RegisterPayload extends LoginPayload {
  nome: string;
}

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ?? "https://poas-wilderfeast.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

export async function login(payload: LoginPayload) {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post<AuthResponse>("/auth/registro", payload);
  return data;
}

export default api;
