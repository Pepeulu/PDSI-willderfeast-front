import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Feral, Monstro } from "@/lib/api";
import { deferred } from "./deferred";

const navigation = vi.hoisted(() => ({
  pathname: "/",
  router: { replace: vi.fn(), refresh: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => navigation.router,
}));

const fetchMock = vi.fn<typeof fetch>();
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
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NEXT_PUBLIC_API_URL", undefined);
  vi.resetModules();
});

describe("página inicial", () => {
  it("mostra o carregamento e apenas os dois primeiros registros do bestiário", async () => {
    const { default: Home } = await import("@/app/page");
    const pending = deferred<Response>();
    fetchMock.mockReturnValueOnce(pending.promise);
    render(<Home />);

    expect(screen.getByRole("status").textContent).toBe("Carregando dados da API...");
    expect(screen.getByRole("link", { name: "Início" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("heading", { name: "CUTELO DE FERRO" })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith("/api/session?resource=monstros", expect.anything());

    await act(async () => {
      pending.resolve(Response.json([
        monster,
        { ...monster, id: 8, nome: "Coruja da Mata", categoria: "Apex", habitat: null, dieta: null, alvos: null },
        { ...monster, id: 9, nome: "Onça da Trilha" },
      ]));
    });

    const first = within(screen.getByRole("heading", { name: "CARPA DA SERRA" }).closest("article")!);
    expect(first.getByText("Categoria: Jovem").classList.contains("threat-low")).toBe(true);
    expect(first.getByText("Escamas")).toBeTruthy();
    expect(first.getByText("6 / 10")).toBeTruthy();
    const second = within(screen.getByRole("heading", { name: "CORUJA DA MATA" }).closest("article")!);
    expect(second.getByText("Categoria: Apex").classList.contains("threat-high")).toBe(true);
    expect(second.getByText("Habitat desconhecido")).toBeTruthy();
    expect(second.getByText("Dieta desconhecida")).toBeTruthy();
    expect(second.getByText("Não informado")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "ONÇA DA TRILHA" })).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("persiste a abertura do menu e encerra a sessão local", async () => {
    const { default: Home } = await import("@/app/page");
    localStorage.setItem("wilderfeast_user", JSON.stringify({ nome: "Iara", email: "outra@example.test" }));
    localStorage.setItem("wilderfeast_sidebar_collapsed", "true");
    fetchMock.mockResolvedValueOnce(Response.json([]));
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    render(<Home />);

    expect(screen.getByText("IARA")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Expandir menu" }));
    expect(localStorage.getItem("wilderfeast_sidebar_collapsed")).toBe("false");
    expect(screen.getByRole("button", { name: "Minimizar menu" }).getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Minimizar menu" }));
    expect(localStorage.getItem("wilderfeast_sidebar_collapsed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    await waitFor(() => expect(navigation.router.refresh).toHaveBeenCalledOnce());
    expect(navigation.router.replace).toHaveBeenCalledWith("/login");
    expect(fetchMock).toHaveBeenLastCalledWith("/api/session", { method: "DELETE" });
    expect(localStorage.getItem("wilderfeast_user")).toBeNull();
  });

  it.each([
    ["{}", "NOME DO FERAL"],
    ['{"email":"pescadora@example.test"}', "PESCADORA"],
    ["{", "NOME DO FERAL"],
  ])("recupera o nome salvo a partir de %s", async (savedUser, expectedName) => {
    const { default: Home } = await import("@/app/page");
    localStorage.setItem("wilderfeast_user", savedUser);
    fetchMock.mockResolvedValueOnce(Response.json([]));
    render(<Home />);

    expect(screen.getByText(expectedName)).toBeTruthy();
    expect(localStorage.getItem("wilderfeast_user")).toBe(savedUser === "{" ? null : savedUser);
    expect(await screen.findByText("Nenhum monstro cadastrado na API.")).toBeTruthy();
  });

  it("apresenta a mensagem padrão se a chamada falhar antes de receber uma resposta", async () => {
    const { default: Home } = await import("@/app/page");
    fetchMock.mockRejectedValueOnce(new TypeError("Sem conexão"));
    render(<Home />);

    expect((await screen.findByRole("alert")).textContent).toBe("Não foi possível carregar os dados.");
    expect(navigation.router.replace).not.toHaveBeenCalled();
  });

  it("exibe o erro da API se a sessão ainda estiver válida", async () => {
    const { default: Home } = await import("@/app/page");
    fetchMock.mockResolvedValueOnce(Response.json({ error: "Bestiário em manutenção" }, { status: 503 }));
    render(<Home />);

    expect((await screen.findByRole("alert")).textContent).toBe("Bestiário em manutenção");
    expect(navigation.router.replace).not.toHaveBeenCalled();
  });
});

describe("lista de fichas", () => {
  it("carrega fichas e filtra os resultados usando o texto normalizado", async () => {
    const { default: Fichas } = await import("@/app/fichas/page");
    navigation.pathname = "/fichas";
    fetchMock.mockResolvedValueOnce(Response.json([
      feral,
      { ...feral, id: 2, nome: "Cauã", titulo: null, especialidade: null, voce_e: null, imagem_url: null },
      { ...feral, id: 3, nome: "Lua", imagem_url: "http://[" },
    ]));
    render(<Fichas />);

    expect(screen.getByRole("link", { name: "CRIAR" }).getAttribute("href")).toBe("/fichas/novo");
    expect(screen.getByRole("link", { name: "Fichas de Personagem" }).getAttribute("aria-current")).toBe("page");
    expect(fetchMock).toHaveBeenCalledWith("/api/session?resource=ferais", expect.anything());
    expect((await screen.findByRole("img", { name: "IARA" })).getAttribute("src")).toBe("https://poas-wilderfeast.onrender.com/media/iara.png");
    expect(screen.getByRole("img", { name: "CAUÃ" }).getAttribute("src")).toMatch(/^data:image\/png;base64,/);
    expect(screen.getByRole("img", { name: "LUA" }).getAttribute("src")).toMatch(/^data:image\/png;base64,/);
    const incompleteCard = within(screen.getByRole("heading", { name: "CAUÃ" }).closest("article")!);
    expect(incompleteCard.getByText("Sem título")).toBeTruthy();
    expect(incompleteCard.getByText("Não definida")).toBeTruthy();

    const search = screen.getByRole("searchbox", { name: "Buscar fichas" });
    fireEvent.change(search, { target: { value: "  RASTREADORA  " } });
    expect(screen.getByRole("heading", { name: "IARA" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "CAUÃ" })).toBeNull();
    fireEvent.change(search, { target: { value: "  coletor  " } });
    expect(screen.getByRole("status").textContent).toBe("Nenhuma ficha encontrada para “coletor”.");
    fireEvent.change(search, { target: { value: "" } });
    expect(screen.getByRole("heading", { name: "CAUÃ" })).toBeTruthy();
  });

  it("resolve imagens relativas contra o endereço configurado da API", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://fichas.example.test");
    const { default: Fichas } = await import("@/app/fichas/page");
    navigation.pathname = "/fichas";
    fetchMock.mockResolvedValueOnce(Response.json([feral]));
    render(<Fichas />);

    expect((await screen.findByRole("img", { name: "IARA" })).getAttribute("src")).toBe("https://fichas.example.test/media/iara.png");
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
    fetchMock.mockResolvedValueOnce(Response.json({ error: "Sessão expirada" }, { status: 401 }));
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    render(<Fichas />);

    await waitFor(() => expect(navigation.router.replace).toHaveBeenCalledWith("/login?next=%2Ffichas"));
    expect(fetchMock).toHaveBeenLastCalledWith("/api/session", { method: "DELETE" });
    expect(localStorage.getItem("wilderfeast_user")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

it.each([
  { from: "/", to: "/fichas", obsolete: [monster], reject: false, empty: "Nenhuma ficha cadastrada." },
  { from: "/fichas", to: "/", obsolete: [feral], reject: false, empty: "Nenhum monstro cadastrado na API." },
  { from: "/fichas", to: "/", obsolete: [], reject: true, empty: "Nenhum monstro cadastrado na API." },
])("ignora a resposta anterior ao navegar de $from para $to (falha: $reject)", async ({ from, to, obsolete, reject, empty }) => {
  const { default: Home } = await import("@/app/page");
  const first = deferred<Response>();
  const current = deferred<Response>();
  navigation.pathname = from;
  fetchMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(current.promise);
  const { rerender } = render(<Home />);

  navigation.pathname = to;
  rerender(<Home />);
  await act(async () => {
    if (reject) first.reject(new TypeError("Resposta obsoleta"));
    else first.resolve(Response.json(obsolete));
  });
  expect(screen.getByRole("status").textContent).toBe("Carregando dados da API...");
  expect(screen.queryByRole("alert")).toBeNull();

  await act(async () => current.resolve(Response.json([])));
  expect(screen.getByRole("status").textContent).toBe(empty);
});
