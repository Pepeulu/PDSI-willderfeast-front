import axios from "axios";

export interface AuthUser {
  id: number;
  nome?: string;
  email: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  usuario_id: number;
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

  const body = new URLSearchParams({
    password: payload.senha,
    username: payload.email,
  });
  const { data } = await api.post<LoginResponse>("/auth/login", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post<AuthUser>("/auth/registro", payload);
  return data;
}

export default api;
