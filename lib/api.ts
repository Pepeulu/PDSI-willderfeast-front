/** @file Contratos de dados e funções usadas pelo cliente para acessar `/api/session`. */

/** Dados de identificação do usuário usados pela interface. */
export interface AuthUser {
  id: number;
  nome?: string;
  email: string;
}

/** Resultado do login retornado ao cliente depois que o servidor grava o cookie. */
export interface LoginResponse {
  token_type: "bearer";
  usuario_id: number;
}

/** Credenciais enviadas pelo formulário de login. */
export interface LoginPayload {
  email: string;
  senha: string;
}

/** Dados necessários para criar uma conta. */
export interface RegisterPayload {
  email: string;
  nome: string;
  senha: string;
}

/** Ficha retornada pela API, com identificadores próprios e do usuário. */
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

/** Campos editáveis enviados tanto na criação quanto na atualização de uma ficha. */
export interface CreateFeralPayload {
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

/** Registro do bestiário com categoria, vigor e informações sobre a criatura. */
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

/** Falha HTTP devolvida pela rota de sessão. */
export class ApiError extends Error {
  /** Código HTTP recebido na resposta. */
  status: number;

  /** Preserva a mensagem a exibir e o status que identifica a falha. */
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Solicita JSON sem cache e converte falhas HTTP em {@link ApiError}. */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  // A resposta pode conter o recurso, uma mensagem de erro ou um corpo sem JSON.
  const data = (await response.json().catch(() => null)) as
    { detail?: string; error?: string } | T | null;

  if (!response.ok) {
    const errorData = data as { detail?: string; error?: string } | null;
    throw new ApiError(
      errorData?.error ??
        errorData?.detail ??
        "Não foi possível acessar a API.",
      response.status,
    );
  }

  return data as T;
}

/** Usa a mensagem da API em falhas HTTP e o texto fornecido nas demais falhas. */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Não foi possível acessar a API.",
) {
  return error instanceof ApiError ? error.message : fallback;
}

/** Autentica o usuário e inicia a sessão no servidor. */
export async function login(payload: LoginPayload) {
  return request<LoginResponse>("/api/session", {
    body: JSON.stringify({ action: "login", payload }),
    method: "POST",
  });
}

/** Cria a conta e retorna os dados do novo usuário. */
export async function register(payload: RegisterPayload) {
  return request<AuthUser>("/api/session", {
    body: JSON.stringify({ action: "register", payload }),
    method: "POST",
  });
}

/** Lista as fichas vinculadas ao usuário autenticado. */
export async function getMyFerais() {
  return request<Feral[]>("/api/session?resource=ferais");
}

/** Cria uma ficha vinculada à sessão atual. */
export async function createFeral(payload: CreateFeralPayload) {
  return request<Feral>("/api/session", {
    body: JSON.stringify({ action: "create-feral", payload }),
    method: "POST",
  });
}

/** Busca pelo ID uma ficha acessível pela sessão atual. */
export async function getFeral(id: number) {
  return request<Feral>(`/api/session?resource=feral&id=${id}`);
}

/** Envia os campos editáveis da ficha e retorna a versão salva. */
export async function updateFeral(id: number, payload: CreateFeralPayload) {
  return request<Feral>("/api/session", {
    body: JSON.stringify({ action: "update-feral", id, payload }),
    method: "PUT",
  });
}

/** Exclui a ficha identificada pelo ID e retorna a confirmação da API. */
export async function deleteFeral(id: number) {
  return request<{ ok: true }>(`/api/session?resource=feral&id=${id}`, {
    method: "DELETE",
  });
}

/** Lista as criaturas disponíveis no bestiário. */
export async function getMonstros() {
  return request<Monstro[]>("/api/session?resource=monstros");
}

/** Busca os detalhes de uma criatura pelo ID. */
export async function getMonstro(id: number) {
  return request<Monstro>(`/api/session?resource=monstro&id=${id}`);
}
