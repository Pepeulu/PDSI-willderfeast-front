// @vitest-environment node

/**
 * Verifica as requisições do cliente da API e a interpretação das respostas HTTP.
 * @module
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  createFeral,
  deleteFeral,
  enviarImagemFeral,
  getApiErrorMessage,
  getFeral,
  getMonstro,
  getMonstros,
  getMyFerais,
  login,
  register,
  updateFeral,
  type FeralPayload,
} from "../lib/api";

/** Substitui a rede e registra as requisições emitidas pelo cliente. */
const fetchMock = vi.fn<typeof fetch>();

it("só envia arquivos de até 4 MB e devolve a URL hospedada", async () => {
  const arquivo = new File(["foto"], "feral.png", { type: "image/png" });
  fetchMock.mockResolvedValueOnce(
    Response.json({ url: "https://imagem.test/feral.png" }),
  );
  await expect(enviarImagemFeral(arquivo)).resolves.toBe(
    "https://imagem.test/feral.png",
  );
  await expect(
    enviarImagemFeral(
      new File([new Uint8Array(4 * 1024 * 1024 + 1)], "grande.png"),
    ),
  ).rejects.toMatchObject({ status: 413 });
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
    "/api/jogo/imagens/feral",
    expect.objectContaining({
      method: "POST",
      body: arquivo,
      headers: { "Content-Type": "application/octet-stream" },
    }),
  );
});

/** Dados fictícios para autenticação, fichas e registros do bestiário. */
const credentials = { email: "feral@example.test", senha: "senha-de-teste" };
const registration = { ...credentials, nome: "Nina" };
const sheet: FeralPayload = {
  nome: "Nina",
  titulo: null,
  especialidade: "Caça",
  imagem_url: null,
  vigor_max: 10,
  vigor_atual: 8,
  voce_e: null,
  tenta_ser: null,
  feras_familiares: null,
  prato_tipico: null,
  tempero_tipico: null,
  infancia_criacao: null,
  iniciacao_como_feral: null,
  ambicao: null,
  conexao: null,
};
const feral = { ...sheet, id: 3, usuario_id: 7 };
const monster = {
  id: 5,
  nome: "Tatu",
  categoria: "Adulto",
  vigor_base: 6,
  vigor_atual: 4,
  historia: null,
  alvos: null,
  dieta: null,
  habitat: null,
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("cliente da API", () => {
  it.each([
    {
      name: "autenticar",
      run: () => login(credentials),
      method: "POST",
      body: { action: "login", payload: credentials },
      result: { token_type: "bearer", usuario_id: 7 },
    },
    {
      name: "cadastrar",
      run: () => register(registration),
      method: "POST",
      body: { action: "register", payload: registration },
      result: { id: 7, nome: registration.nome, email: registration.email },
    },
    {
      name: "criar uma ficha",
      run: () => createFeral({ ...sheet, utensilio_id: 9 }),
      method: "POST",
      body: { action: "create-feral", payload: { ...sheet, utensilio_id: 9 } },
      result: feral,
    },
    {
      name: "atualizar uma ficha",
      run: () => updateFeral(3, sheet),
      method: "PUT",
      body: { action: "update-feral", id: 3, payload: sheet },
      result: feral,
    },
  ])("envia JSON para $name", async ({ run, method, body, result }) => {
    fetchMock.mockResolvedValueOnce(Response.json(result));

    await expect(run()).resolves.toEqual(result);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/session", {
      body: JSON.stringify(body),
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      method,
    });
  });

  it.each([
    { resource: "ferais", run: getMyFerais, result: [feral] },
    { resource: "feral&id=3", run: () => getFeral(3), result: feral },
    { resource: "monstros", run: getMonstros, result: [monster] },
    { resource: "monstro&id=5", run: () => getMonstro(5), result: monster },
  ])("consulta $resource sem cache", async ({ resource, run, result }) => {
    fetchMock.mockResolvedValueOnce(Response.json(result));

    await expect(run()).resolves.toEqual(result);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      `/api/session?resource=${resource}`,
      {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      },
    );
  });

  it("envia DELETE para o recurso da ficha", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ ok: true }));

    await expect(deleteFeral(3)).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "/api/session?resource=feral&id=3",
      {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      },
    );
  });

  it.each([
    {
      body: JSON.stringify({
        error: "Sessão expirada.",
        detail: "Detalhe adicional.",
      }),
      status: 401,
      message: "Sessão expirada.",
    },
    {
      body: JSON.stringify({ detail: "Ficha não encontrada." }),
      status: 404,
      message: "Ficha não encontrada.",
    },
    {
      body: JSON.stringify({}),
      status: 500,
      message: "Não foi possível acessar a API.",
    },
    { body: "<html>", status: 503, message: "Não foi possível acessar a API." },
  ])(
    "expõe o status $status e a mensagem de erro",
    async ({ body, status, message }) => {
      fetchMock.mockResolvedValueOnce(new Response(body, { status }));

      await expect(getFeral(3)).rejects.toMatchObject({
        name: "ApiError",
        status,
        message,
      });
    },
  );

  it("retorna nulo quando a resposta de sucesso não contém JSON", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(getFeral(3)).resolves.toBeNull();
  });
});

describe("getApiErrorMessage", () => {
  it("usa a mensagem da API ou o texto alternativo para falhas desconhecidas", () => {
    expect(
      getApiErrorMessage(
        new ApiError("Sessão expirada.", 401),
        "Outra mensagem.",
      ),
    ).toBe("Sessão expirada.");
    expect(
      getApiErrorMessage(new Error("Falha de rede."), "Tente mais tarde."),
    ).toBe("Tente mais tarde.");
    expect(getApiErrorMessage(undefined)).toBe(
      "Não foi possível acessar a API.",
    );
  });
});
