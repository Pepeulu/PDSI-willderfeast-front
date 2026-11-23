/**
 * Verifica a navegação, o carregamento e a busca na página inicial e na lista de fichas.
 * @module
 */

import imagensCloudinary from "@/lib/imagens-cloudinary.json";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Feral, Monstro } from "@/lib/api";
import { deferred } from "./deferred";

/** Permite alternar entre as rotas e observar redirecionamentos e atualizações. */
const navigation = vi.hoisted(() => ({
  pathname: "/",
  router: { replace: vi.fn(), refresh: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => navigation.router,
}));

/** Controla o transporte para simular respostas da API por rota. */
const fetchMock = vi.fn<typeof fetch>();
const fetchCatalogo = vi.fn<typeof fetch>();

/** Fera e ficha de referência usadas para testar a exibição e a navegação. */
const monster: Monstro = {
  id: 7,
  nome: "Carpa da Serra",
  categoria: "Jovem",
  vigor_base: 10,
  vigor_atual: 6,
  historia: null,
  alvos: "Escamas",
  dieta: "Frutas",
  habitat: "Rio",
};
const feral: Feral = {
  id: 1,
  usuario_id: 3,
  nome: "Iara",
  titulo: "Guardião das Águas",
  especialidade: "Rastreadora",
  imagem_url: "/media/iara.png",
  vigor_max: 10,
  vigor_atual: 5,
  voce_e: "Viajante",
  tenta_ser: null,
  feras_familiares: null,
  prato_tipico: null,
  tempero_tipico: null,
  infancia_criacao: null,
  iniciacao_como_feral: null,
  ambicao: null,
  conexao: null,
};

beforeEach(() => {
  navigation.pathname = "/";
  navigation.router.replace.mockReset();
  navigation.router.refresh.mockReset();
  fetchMock.mockReset();
  fetchCatalogo.mockReset().mockImplementation(async () => Response.json([]));
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) =>
    input === "/api/jogo/utensilio"
      ? fetchCatalogo(input, init)
      : fetchMock(input, init),
  );
  vi.stubEnv("NEXT_PUBLIC_API_URL", undefined);
  vi.resetModules();
});

describe("página inicial", () => {
  it("mostra o carregamento e as três primeiras feras do bestiário", async () => {
    const { default: Home } = await import("@/app/page");
    const pending = deferred<Response>();
    fetchMock.mockReturnValueOnce(pending.promise);
    render(<Home />);

    expect(screen.getByRole("status").textContent).toBe(
      "Carregando dados da API...",
    );
    expect(
      screen.getByRole("link", { name: "Início" }).getAttribute("aria-current"),
    ).toBe("page");
    expect(
      screen.getByRole("link", { name: "Ver catálogo" }).getAttribute("href"),
    ).toBe("/utensilios");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/session?resource=monstros",
      expect.anything(),
    );

    await act(async () => {
      pending.resolve(
        Response.json([
          monster,
          {
            ...monster,
            id: 8,
            nome: "Coruja da Mata",
            categoria: "Apex",
            habitat: null,
            dieta: null,
            alvos: null,
          },
          { ...monster, id: 9, nome: "Peliçalce" },
          { ...monster, id: 10, nome: "Lobo da Mata" },
        ]),
      );
    });

    const cards = screen
      .getAllByRole("link")
      .filter((link) => link.classList.contains("bestiary-card"));
    expect(cards.map((card) => card.getAttribute("href"))).toEqual([
      "/bestiario/7",
      "/bestiario/8",
      "/bestiario/9",
    ]);
    expect(
      within(cards[0]).getByRole("heading", { name: "Carpa da Serra" }),
    ).toBeTruthy();
    expect(within(cards[0]).getByText("Ilustração indisponível")).toBeTruthy();
    expect(
      within(cards[2])
        .getByRole("img", { name: "Ilustração de Peliçalce" })
        .getAttribute("src"),
    ).toBe(imagensCloudinary.bestiario["pelicalce.jpg"]);
    expect(within(cards[0]).getByText("REGISTRO #007")).toBeTruthy();
    expect(within(cards[0]).getByText("VIGOR 6 / 10")).toBeTruthy();
    expect(within(cards[1]).getByText("Habitat desconhecido")).toBeTruthy();
    expect(within(cards[1]).getByText("Dieta desconhecida")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("mostra até três utensílios que vieram do catálogo", async () => {
    const { default: Home } = await import("@/app/page");
    fetchMock.mockResolvedValueOnce(Response.json([]));
    const pending = deferred<Response>();
    fetchCatalogo.mockReturnValueOnce(pending.promise);
    render(<Home />);
    const secao = within(
      screen.getByRole("region", { name: "Catálogo de utensílios" }),
    );
    expect(secao.getByText("Carregando utensílios…")).toBeTruthy();
    pending.resolve(
      Response.json(
        ["Cutelo", "Panela", "Concha", "Espeto"].map((nome, id) => ({
          nome,
          id,
          durabilidade_max: 20,
          alcance: "1 (Golpe)",
          estilos_principais: ["Poderoso", "Preciso"],
          tecnicas: [{ id: 1, nome: "Corte Limpo", descricao: null }],
        })),
      ),
    );
    expect(
      await secao.findByRole("img", { name: "Ilustração de Cutelo" }),
    ).toBeTruthy();
    expect(
      secao.getAllByRole("heading", { level: 3 }).map((h) => h.textContent),
    ).toEqual(["Cutelo", "Panela", "Concha"]);
    const cutelo = within(
      secao.getByRole("heading", { name: "Cutelo" }).closest("article")!,
    );
    expect(cutelo.getByText("Alcance · 1 (Golpe)")).toBeTruthy();
    expect(cutelo.getByText("Corte Limpo")).toBeTruthy();
    expect(cutelo.getByText("Poderoso · 2 ou 3")).toBeTruthy();
    expect(cutelo.queryByText("Durabilidade")).toBeNull();
    expect(cutelo.queryByText("Estilos iniciais do Feral.")).toBeNull();
    expect(cutelo.queryByText(/Se quebrado/)).toBeNull();
    expect(secao.getByText("Sem ilustração")).toBeTruthy();
    fetchCatalogo.mockResolvedValueOnce(Response.json({}, { status: 503 }));
    fireEvent(window, new Event("focus"));
    expect(
      await secao.findByText("Não foi possível carregar os utensílios."),
    ).toBeTruthy();
  });

  it("persiste a abertura do menu e encerra a sessão local", async () => {
    const { default: Home } = await import("@/app/page");
    localStorage.setItem(
      "wilderfeast_user",
      JSON.stringify({ nome: "Iara", email: "outra@example.test" }),
    );
    localStorage.setItem("wilderfeast_sidebar_collapsed", "true");
    const savePreference = vi.spyOn(Storage.prototype, "setItem");
    fetchMock.mockImplementation(async (_input, init) =>
      init?.method === "DELETE"
        ? new Response(null, { status: 204 })
        : Response.json([]),
    );
    render(
      <StrictMode>
        <Home />
      </StrictMode>,
    );

    expect(screen.getByText("@Iara")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Expandir menu" }));
    expect(savePreference).toHaveBeenCalledExactlyOnceWith(
      "wilderfeast_sidebar_collapsed",
      "false",
    );
    expect(localStorage.getItem("wilderfeast_sidebar_collapsed")).toBe("false");
    expect(
      screen
        .getByRole("button", { name: "Minimizar menu" })
        .getAttribute("aria-expanded"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Minimizar menu" }));
    expect(savePreference).toHaveBeenCalledTimes(2);
    expect(savePreference).toHaveBeenLastCalledWith(
      "wilderfeast_sidebar_collapsed",
      "true",
    );
    expect(localStorage.getItem("wilderfeast_sidebar_collapsed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    await waitFor(() =>
      expect(navigation.router.refresh).toHaveBeenCalledOnce(),
    );
    expect(navigation.router.replace).toHaveBeenCalledWith("/login");
    expect(fetchMock).toHaveBeenLastCalledWith("/api/session", {
      method: "DELETE",
    });
    expect(localStorage.getItem("wilderfeast_user")).toBeNull();
  });

  it.each([
    ["{}", "NOME DO FERAL"],
    ['{"email":"pescadora@example.test"}', "@pescadora"],
    ["{", "NOME DO FERAL"],
  ])(
    "recupera o nome salvo a partir de %s",
    async (savedUser, expectedName) => {
      const { default: Home } = await import("@/app/page");
      localStorage.setItem("wilderfeast_user", savedUser);
      fetchMock.mockResolvedValueOnce(Response.json([]));
      render(<Home />);

      expect(screen.getByText(expectedName)).toBeTruthy();
      expect(localStorage.getItem("wilderfeast_user")).toBe(
        savedUser === "{" ? null : savedUser,
      );
      expect(
        await screen.findByText("Nenhum monstro cadastrado na API."),
      ).toBeTruthy();
    },
  );

  it("apresenta a mensagem padrão se a chamada falhar antes de receber uma resposta", async () => {
    const { default: Home } = await import("@/app/page");
    fetchMock.mockRejectedValueOnce(new TypeError("Sem conexão"));
    render(<Home />);

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Não foi possível carregar os dados.",
    );
    expect(navigation.router.replace).not.toHaveBeenCalled();
  });

  it("exibe o erro da API se a sessão ainda estiver válida", async () => {
    const { default: Home } = await import("@/app/page");
    fetchMock.mockResolvedValueOnce(
      Response.json({ error: "Bestiário em manutenção" }, { status: 503 }),
    );
    render(<Home />);

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Bestiário em manutenção",
    );
    expect(navigation.router.replace).not.toHaveBeenCalled();
  });
});

describe("lista de fichas", () => {
  it("carrega fichas e filtra os resultados usando o texto normalizado", async () => {
    const { default: Fichas } = await import("@/app/fichas/page");
    navigation.pathname = "/fichas";
    fetchMock.mockResolvedValueOnce(
      Response.json([
        feral,
        {
          ...feral,
          id: 2,
          nome: "Cauã",
          titulo: null,
          especialidade: null,
          voce_e: null,
          imagem_url: null,
        },
        { ...feral, id: 3, nome: "Lua", imagem_url: "http://[" },
      ]),
    );
    render(<Fichas />);

    expect(
      screen.getByRole("link", { name: "CRIAR" }).getAttribute("href"),
    ).toBe("/fichas/novo");
    expect(
      screen
        .getByRole("link", { name: "Fichas de Personagem" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/session?resource=ferais",
      expect.anything(),
    );
    expect(
      (await screen.findByRole("img", { name: "IARA" })).getAttribute("src"),
    ).toBe("https://poas-wilderfeast.onrender.com/media/iara.png");
    expect(screen.getByRole("img", { name: "CAUÃ" }).getAttribute("src")).toBe(
      imagensCloudinary.interface.ember,
    );
    expect(screen.getByRole("img", { name: "LUA" }).getAttribute("src")).toBe(
      imagensCloudinary.interface.toad,
    );
    const ficha = screen.getByRole("link", { name: "CAUÃ" });
    expect(ficha.getAttribute("href")).toBe("/fichas/2");
    const incompleteCard = within(ficha);
    expect(incompleteCard.getByText("Sem título")).toBeTruthy();
    expect(incompleteCard.getByText("Não definida")).toBeTruthy();

    const search = screen.getByRole("searchbox", { name: "Buscar fichas" });
    fireEvent.change(search, { target: { value: "  RASTREADORA  " } });
    expect(screen.getByRole("heading", { name: "IARA" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "CAUÃ" })).toBeNull();
    fireEvent.change(search, { target: { value: "  coletor  " } });
    expect(screen.getByRole("status").textContent).toBe(
      "Nenhuma ficha encontrada para “coletor”.",
    );
    fireEvent.change(search, { target: { value: "" } });
    expect(screen.getByRole("heading", { name: "CAUÃ" })).toBeTruthy();
  });

  it("resolve imagens relativas contra o endereço configurado da API", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://fichas.example.test");
    const { default: Fichas } = await import("@/app/fichas/page");
    navigation.pathname = "/fichas";
    fetchMock.mockResolvedValueOnce(Response.json([feral]));
    render(<Fichas />);

    expect(
      (await screen.findByRole("img", { name: "IARA" })).getAttribute("src"),
    ).toBe("https://fichas.example.test/media/iara.png");
  });

  it("mostra o estado vazio quando nenhuma ficha foi cadastrada", async () => {
    const { default: Fichas } = await import("@/app/fichas/page");
    navigation.pathname = "/fichas";
    fetchMock.mockResolvedValueOnce(Response.json([]));
    render(<Fichas />);

    expect(await screen.findByText("Nenhuma ficha cadastrada.")).toBeTruthy();
  });

  it("redireciona para o login com a rota de retorno quando a API responde 401", async () => {
    const { default: Fichas } = await import("@/app/fichas/page");
    navigation.pathname = "/fichas";
    localStorage.setItem("wilderfeast_user", JSON.stringify({ nome: "Iara" }));
    fetchMock.mockResolvedValueOnce(
      Response.json({ error: "Sessão expirada" }, { status: 401 }),
    );
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    render(<Fichas />);

    await waitFor(() =>
      expect(navigation.router.replace).toHaveBeenCalledWith(
        "/login?next=%2Ffichas",
      ),
    );
    expect(fetchMock).toHaveBeenLastCalledWith("/api/session", {
      method: "DELETE",
    });
    expect(localStorage.getItem("wilderfeast_user")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

it.each([
  {
    from: "/",
    to: "/fichas",
    obsolete: [monster],
    reject: false,
    empty: "Nenhuma ficha cadastrada.",
  },
  {
    from: "/fichas",
    to: "/",
    obsolete: [feral],
    reject: false,
    empty: "Nenhum monstro cadastrado na API.",
  },
  {
    from: "/fichas",
    to: "/",
    obsolete: [],
    reject: true,
    empty: "Nenhum monstro cadastrado na API.",
  },
])(
  "ignora a resposta anterior ao navegar de $from para $to (falha: $reject)",
  async ({ from, to, obsolete, reject, empty }) => {
    const { default: Home } = await import("@/app/page");
    const first = deferred<Response>();
    const current = deferred<Response>();
    navigation.pathname = from;
    fetchMock
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(current.promise);
    const { rerender } = render(<Home />);

    navigation.pathname = to;
    rerender(<Home />);
    await act(async () => {
      if (reject) first.reject(new TypeError("Resposta obsoleta"));
      else first.resolve(Response.json(obsolete));
    });
    expect(screen.getByRole("status").textContent).toBe(
      "Carregando dados da API...",
    );
    expect(screen.queryByRole("alert")).toBeNull();

    await act(async () => current.resolve(Response.json([])));
    expect(screen.getByRole("status").textContent).toBe(empty);
  },
);
