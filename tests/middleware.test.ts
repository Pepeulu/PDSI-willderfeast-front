// @vitest-environment node

/**
 * Verifica quais caminhos usam o middleware e como ele trata a sessão e o redirecionamento.
 * @module
 */

import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, middleware } from "../middleware";

/** Origem fictícia usada para montar as requisições e verificar o redirecionamento. */
const origin = "https://wilderfeast.example.test";

describe("middleware de autenticação", () => {
  it.each(["/login", "/cadastro"])("permite acesso público a %s", (path) => {
    const response = middleware(new NextRequest(`${origin}${path}`));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("permite que uma sessão acesse uma página protegida", () => {
    const request = new NextRequest(`${origin}/perfil`, {
      headers: { cookie: "wilderfeast_token=token-de-teste" },
    });

    expect(middleware(request).headers.get("x-middleware-next")).toBe("1");
  });

  it("redireciona ao login preservando a página e sua consulta", () => {
    const response = middleware(
      new NextRequest(`${origin}/fichas/3?aba=historia`),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `${origin}/login?next=%2Ffichas%2F3%3Faba%3Dhistoria`,
    );
  });

  it.each([
    ["/api/session", false],
    ["/_next/static/main.js", false],
    ["/_next/image", false],
    ["/favicon.ico", false],
    ["/assets/world.jpg", false],
    ["/perfil", true],
    ["/login", true],
  ])("aplica o matcher à rota %s", (url, matches) => {
    expect(unstable_doesMiddlewareMatch({ config, url })).toBe(matches);
  });
});
