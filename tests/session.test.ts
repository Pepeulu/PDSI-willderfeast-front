// @vitest-environment node

/**
 * Verifica o proxy de sessão, os cookies e as respostas para cada método HTTP.
 * @module
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

/** Simula o armazenamento de cookies do Next.js. */
const cookieStore = vi.hoisted(() => ({
  get: vi.fn<(name: string) => { name: string; value: string } | undefined>(),
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));

/** Origens, credenciais e fichas fictícias compartilhadas entre os cenários. */
const apiOrigin = "https://api.example.test";
const appOrigin = "https://wilderfeast.example.test";
const token = "token-de-teste";
const credentials = { email: "feral@example.test", senha: "senha-de-teste" };
const registration = { ...credentials, nome: "Nina" };
const sheet = {
  nome: "Nina",
  especialidade: "Caça",
  vigor_max: 10,
  vigor_atual: 8,
};
const feral = { ...sheet, id: 3, usuario_id: 7 };
const novaFicha = { ...sheet, utensilio_id: 6 };
/** Captura requisições encaminhadas ao serviço externo sem acessar a rede. */
const fetchMock = vi.fn<typeof fetch>();

/** Cabeçalhos esperados nas requisições com token ou corpo JSON. */
const authorization = { Authorization: `Bearer ${token}` };
const jsonHeaders = { "Content-Type": "application/json" };
/** Rota recarregada em cada cenário após configurar os simuladores. */
let session: typeof import("../app/api/session/route");

/** Monta uma requisição local com parâmetros de consulta ou corpo JSON. */
function request(method: "GET" | "DELETE", query?: string): Request;
function request(method: "POST" | "PUT", body: object): Request;
function request(method: string, data?: object | string) {
  if (typeof data === "object") {
    return new Request(`${appOrigin}/api/session`, {
      body: JSON.stringify(data),
      headers: jsonHeaders,
      method,
    });
  }
  return new Request(`${appOrigin}/api/session${data ?? ""}`, { method });
}

/** Configura o cookie usado nas requisições com sessão autenticada. */
function authenticate() {
  cookieStore.get.mockReturnValue({ name: "wilderfeast_token", value: token });
}

/** Confere o status e o corpo JSON devolvidos pela rota. */
async function expectJson(response: Response, status: number, body: unknown) {
  expect(response.status).toBe(status);
  await expect(response.json()).resolves.toEqual(body);
}

beforeEach(async () => {
  vi.resetModules();
  cookieStore.get.mockReset();
  cookieStore.set.mockReset();
  cookieStore.delete.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NEXT_PUBLIC_API_URL", apiOrigin);
  session = await import("../app/api/session/route");
});

describe("POST /api/session", () => {
  it("encaminha o cadastro e preserva o status criado", async () => {
    const user = { id: 7, nome: registration.nome, email: registration.email };
    fetchMock.mockResolvedValueOnce(Response.json(user, { status: 201 }));

    await expectJson(
      await session.POST(
        request("POST", { action: "register", payload: registration }),
      ),
      201,
      user,
    );
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      `${apiOrigin}/auth/registro`,
      {
        body: JSON.stringify(registration),
        cache: "no-store",
        headers: jsonHeaders,
        method: "POST",
      },
    );
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it.each([
    { body: '{"detail":123}', message: "123" },
    {
      body: '{"unexpected":true}',
      message: "A API do Wilderfeast não respondeu como esperado.",
    },
    {
      body: '"texto"',
      message: "A API do Wilderfeast não respondeu como esperado.",
    },
    {
      body: "<html>",
      message: "A API do Wilderfeast não respondeu como esperado.",
    },
  ])(
    "devolve um erro de cadastro quando o servidor retorna $body",
    async ({ body, message }) => {
      fetchMock.mockResolvedValueOnce(new Response(body, { status: 409 }));

      await expectJson(
        await session.POST(
          request("POST", { action: "register", payload: registration }),
        ),
        409,
        {
          error: message,
        },
      );
    },
  );

  it("envia o formulário de login e guarda o token em cookie HttpOnly", async () => {
    vi.stubEnv("NODE_ENV", "production");
    fetchMock.mockResolvedValueOnce(
      Response.json({
        access_token: token,
        token_type: "bearer",
        usuario_id: 7,
      }),
    );

    await expectJson(
      await session.POST(
        request("POST", { action: "login", payload: credentials }),
      ),
      200,
      {
        token_type: "bearer",
        usuario_id: 7,
      },
    );
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      `${apiOrigin}/auth/login`,
      {
        body: expect.any(URLSearchParams),
        cache: "no-store",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        method: "POST",
      },
    );
    const form = fetchMock.mock.calls[0][1]?.body as URLSearchParams;
    expect(Object.fromEntries(form)).toEqual({
      password: credentials.senha,
      username: credentials.email,
    });
    expect(cookieStore.set).toHaveBeenCalledExactlyOnceWith(
      "wilderfeast_token",
      token,
      {
        httpOnly: true,
        maxAge: 604800,
        path: "/",
        sameSite: "lax",
        secure: true,
      },
    );
  });

  it("propaga a rejeição de credenciais sem criar uma sessão", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ detail: "Credenciais inválidas." }, { status: 401 }),
    );

    await expectJson(
      await session.POST(
        request("POST", { action: "login", payload: credentials }),
      ),
      401,
      {
        error: "Credenciais inválidas.",
      },
    );
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("permite salvar diretamente um token em ambiente local", async () => {
    vi.stubEnv("NODE_ENV", "development");

    await expectJson(await session.POST(request("POST", { token })), 200, {
      ok: true,
    });
    expect(cookieStore.set).toHaveBeenCalledExactlyOnceWith(
      "wilderfeast_token",
      token,
      expect.objectContaining({ secure: false }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([{ token: "" }, { action: "unknown" }, {}])(
    "rejeita dados ausentes (%j)",
    async (body) => {
      await expectJson(await session.POST(request("POST", body)), 400, {
        error: "Dados da sessão ausentes.",
      });
      expect(cookieStore.set).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("exige uma sessão para criar uma ficha", async () => {
    await expectJson(
      await session.POST(
        request("POST", { action: "create-feral", payload: sheet }),
      ),
      401,
      {
        error: "Sessão não encontrada.",
      },
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("cria uma ficha em nome da sessão ativa", async () => {
    authenticate();
    fetchMock.mockResolvedValueOnce(Response.json(feral, { status: 201 }));

    await expectJson(
      await session.POST(
        request("POST", { action: "create-feral", payload: novaFicha }),
      ),
      201,
      feral,
    );
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`${apiOrigin}/feral/`, {
      body: JSON.stringify(novaFicha),
      cache: "no-store",
      headers: { ...authorization, ...jsonHeaders },
      method: "POST",
    });
  });

  it("propaga o erro ao criar uma ficha", async () => {
    authenticate();
    fetchMock.mockResolvedValueOnce(
      Response.json({ detail: "Nome inválido." }, { status: 422 }),
    );

    await expectJson(
      await session.POST(
        request("POST", { action: "create-feral", payload: sheet }),
      ),
      422,
      {
        error: "Nome inválido.",
      },
    );
  });
});

describe("GET /api/session", () => {
  it.each(["", "?resource=outro", "?resource=feral", "?resource=monstro"])(
    "rejeita o recurso %s",
    async (query) => {
      await expectJson(await session.GET(request("GET", query)), 400, {
        error: "Recurso inválido.",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each(["ferais", "feral&id=3"])(
    "exige sessão para consultar %s",
    async (resource) => {
      await expectJson(
        await session.GET(request("GET", `?resource=${resource}`)),
        401,
        {
          error: "Sessão não encontrada.",
        },
      );
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    { resource: "ferais", path: "/feral/meus", body: [feral] },
    { resource: "feral&id=3%2F7", path: "/feral/3%2F7", body: feral },
  ])(
    "encaminha $resource com autorização",
    async ({ resource, path, body }) => {
      authenticate();
      fetchMock.mockResolvedValueOnce(Response.json(body));

      await expectJson(
        await session.GET(request("GET", `?resource=${resource}`)),
        200,
        body,
      );
      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`${apiOrigin}${path}`, {
        cache: "no-store",
        headers: authorization,
      });
    },
  );

  it.each([
    {
      resource: "monstros",
      path: "/monstro/",
      body: [{ id: 5, nome: "Tatu" }],
    },
    {
      resource: "monstro&id=5%2F7",
      path: "/monstro/5%2F7",
      body: { id: 5, nome: "Tatu" },
    },
  ])(
    "permite consultar $resource sem sessão",
    async ({ resource, path, body }) => {
      fetchMock.mockResolvedValueOnce(Response.json(body));

      await expectJson(
        await session.GET(request("GET", `?resource=${resource}`)),
        200,
        body,
      );
      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`${apiOrigin}${path}`, {
        cache: "no-store",
        headers: undefined,
      });
    },
  );

  it("usa a URL padrão da API quando a configuração está ausente", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_API_URL", undefined);
    const { GET } = await import("../app/api/session/route");
    fetchMock.mockResolvedValueOnce(Response.json([]));

    await expectJson(await GET(request("GET", "?resource=monstros")), 200, []);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "https://poas-wilderfeast.onrender.com/monstro/",
      {
        cache: "no-store",
        headers: undefined,
      },
    );
  });

  it("propaga o erro de consulta do servidor", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ detail: "Monstro não encontrado." }, { status: 404 }),
    );

    await expectJson(
      await session.GET(request("GET", "?resource=monstro&id=5")),
      404,
      {
        error: "Monstro não encontrado.",
      },
    );
  });
});

describe("PUT /api/session", () => {
  const update = { action: "update-feral", id: 3, payload: sheet };

  it.each([{}, { action: "create-feral", payload: sheet }])(
    "rejeita uma ação inválida (%j)",
    async (body) => {
      await expectJson(await session.PUT(request("PUT", body)), 400, {
        error: "Ação inválida.",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([0, 3.5])(
    "rejeita um identificador de ficha inválido (%s)",
    async (id) => {
      await expectJson(
        await session.PUT(request("PUT", { ...update, id })),
        400,
        { error: "Ficha inválida." },
      );
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("exige sessão para atualizar uma ficha", async () => {
    await expectJson(await session.PUT(request("PUT", update)), 401, {
      error: "Sessão não encontrada.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envia a ficha atualizada com o token de sessão", async () => {
    authenticate();
    fetchMock.mockResolvedValueOnce(Response.json(feral));

    await expectJson(await session.PUT(request("PUT", update)), 200, feral);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`${apiOrigin}/feral/3`, {
      body: JSON.stringify(sheet),
      cache: "no-store",
      headers: { ...authorization, ...jsonHeaders },
      method: "PUT",
    });
  });

  it("propaga uma atualização rejeitada pelo servidor", async () => {
    authenticate();
    fetchMock.mockResolvedValueOnce(
      Response.json({ detail: "Ficha não encontrada." }, { status: 404 }),
    );

    await expectJson(await session.PUT(request("PUT", update)), 404, {
      error: "Ficha não encontrada.",
    });
  });
});

describe("DELETE /api/session", () => {
  it("exige sessão para excluir uma ficha", async () => {
    await expectJson(
      await session.DELETE(request("DELETE", "?resource=feral&id=3")),
      401,
      {
        error: "Sessão não encontrada.",
      },
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["?resource=feral", "?resource=feral&id=abc"])(
    "rejeita o identificador inválido em %s",
    async (query) => {
      authenticate();

      await expectJson(await session.DELETE(request("DELETE", query)), 400, {
        error: "Ficha inválida.",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("exclui a ficha com autorização e mantém a sessão ativa", async () => {
    authenticate();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expectJson(
      await session.DELETE(request("DELETE", "?resource=feral&id=3")),
      200,
      { ok: true },
    );
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`${apiOrigin}/feral/3`, {
      cache: "no-store",
      headers: authorization,
      method: "DELETE",
    });
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });

  it("propaga uma exclusão rejeitada pelo servidor", async () => {
    authenticate();
    fetchMock.mockResolvedValueOnce(
      Response.json({ detail: "Ficha não encontrada." }, { status: 404 }),
    );

    await expectJson(
      await session.DELETE(request("DELETE", "?resource=feral&id=3")),
      404,
      {
        error: "Ficha não encontrada.",
      },
    );
  });

  it("encerra a sessão local mesmo se a solicitação de logout falhar", async () => {
    authenticate();
    fetchMock.mockRejectedValueOnce(new TypeError("Falha de rede."));

    await expectJson(await session.DELETE(request("DELETE")), 200, {
      ok: true,
    });
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      `${apiOrigin}/auth/logout`,
      {
        cache: "no-store",
        headers: authorization,
        method: "POST",
      },
    );
    expect(cookieStore.delete).toHaveBeenCalledExactlyOnceWith(
      "wilderfeast_token",
    );
  });

  it("limpa o cookie de logout mesmo quando não há token", async () => {
    await expectJson(await session.DELETE(request("DELETE")), 200, {
      ok: true,
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(cookieStore.delete).toHaveBeenCalledExactlyOnceWith(
      "wilderfeast_token",
    );
  });
});
