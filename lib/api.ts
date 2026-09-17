export interface AuthUser {
  id: number;
  nome?: string;
  email: string;
}

export interface LoginResponse {
  token_type: "bearer";
  usuario_id: number;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface RegisterPayload {
  email: string;
  nome: string;
  senha: string;
}

export interface Feral {
  id: number;
  usuario_id: number;
  nome: string;
  titulo: string | null;
  especialidade: string | null;
  imagem_url: string | null;
  vigor_max: number;
  vigor_atual: number;
  voce_e: string | null;
  tenta_ser: string | null;
  feras_familiares: string | null;
  prato_tipico: string | null;
  tempero_tipico: string | null;
  infancia_criacao: string | null;
  iniciacao_como_feral: string | null;
  ambicao: string | null;
  conexao: string | null;
}

export interface Monstro {
  id: number;
  nome: string;
  categoria: "Jovem" | "Adulto" | "Apex";
  vigor_base: number;
  vigor_atual: number;
  historia: string | null;
  alvos: string | null;
  dieta: string | null;
  habitat: string | null;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const data = (await response.json().catch(() => null)) as
    | { detail?: string; error?: string }
    | T
    | null;

  if (!response.ok) {
    const errorData = data as { detail?: string; error?: string } | null;
    throw new ApiError(
      errorData?.error ?? errorData?.detail ?? "Não foi possível acessar a API.",
      response.status,
    );
  }

  return data as T;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Não foi possível acessar a API.",
) {
  return error instanceof ApiError ? error.message : fallback;
}

export async function login(payload: LoginPayload) {
  return request<LoginResponse>("/api/session", {
    body: JSON.stringify({ action: "login", payload }),
    method: "POST",
  });
}

export async function register(payload: RegisterPayload) {
  return request<AuthUser>("/api/session", {
    body: JSON.stringify({ action: "register", payload }),
    method: "POST",
  });
}

export async function getMyFerais() {
  return request<Feral[]>("/api/session?resource=ferais");
}

export async function getMonstros() {
  return request<Monstro[]>("/api/session?resource=monstros");
}
