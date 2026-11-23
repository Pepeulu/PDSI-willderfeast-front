import imagensCloudinary from "@/lib/imagens-cloudinary.json";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import Utensilios from "@/app/utensilios/page";
import Atributos from "@/app/fichas/[id]/atributos/page";
import { deferred } from "./deferred";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
  useParams: () => ({ id: "3" }),
  useRouter: () => ({}),
}));
beforeEach(() => {
  window.history.replaceState({}, "", "/utensilios?feral=3");
});
const ferais = [
  { id: 3, nome: "Lia" },
  { id: 5, nome: "Nina" },
];
const catalogo = [
  {
    id: 1,
    nome: "Cutelo",
    alcance: "Curto",
    durabilidade_max: 5,
    tecnicas: [{ id: 1, nome: "Corte", descricao: "Preciso" }],
  },
];
const item = {
  id: 8,
  utensilio: catalogo[0],
  durabilidade_atual: 5,
  se_quebrado: false,
  tecnicas: [{ id: 2, nome: "Aparar", descricao: "Defesa" }],
};
const segundo = {
  ...item,
  id: 9,
  utensilio: { ...catalogo[0], nome: "Espeto", alcance: null, tecnicas: [] },
  tecnicas: [],
};
const sucesso = (data: unknown) => Response.json(data);
const erro = (status = 422) =>
  Response.json({ error: "Operação recusada." }, { status });
function simular(
  responderCatalogo = () => sucesso(catalogo),
  responderItens = (_url: string, _init?: RequestInit) => sucesso([]),
) {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", (url: RequestInfo | URL, init?: RequestInit) =>
    url === "/api/jogo/utensilio"
      ? Promise.resolve(responderCatalogo())
      : typeof url === "string" && /\/itens-encontrados(?:\/\d+)?$/.test(url)
        ? Promise.resolve(responderItens(url, init))
        : mock(url, init),
  );
  return mock;
}

it("adiciona, ajusta e edita itens encontrados na ficha selecionada", async () => {
  const adicionado = {
    id: 41,
    nome: "Cogumelo",
    quantidade: 2,
    descricao: "Do bosque",
  };
  let salvo = adicionado;
  const itens = vi.fn((url: string, init?: RequestInit) => {
    if (init?.method === "POST") return sucesso(salvo);
    if (init?.method === "PATCH") {
      salvo = {
        ...salvo,
        quantidade: salvo.quantidade + JSON.parse(String(init.body)).variacao,
      };
      return salvo.quantidade
        ? sucesso(salvo)
        : new Response(null, { status: 204 });
    }
    if (init?.method === "PUT") {
      salvo = { ...salvo, ...JSON.parse(String(init.body)) };
      return sucesso(salvo);
    }
    return sucesso(
      url.includes("/3/")
        ? []
        : [{ id: 50, nome: "Pedra lisa", quantidade: 1, descricao: null }],
    );
  });
  simular(undefined, itens)
    .mockResolvedValueOnce(sucesso(ferais))
    .mockResolvedValueOnce(sucesso([item]))
    .mockResolvedValueOnce(sucesso(ferais))
    .mockResolvedValueOnce(sucesso([]));
  const tela = render(<Utensilios />);
  const secao = within(
    await screen.findByRole("region", { name: "Itens encontrados" }),
  );
  const adicionar = () =>
    secao.findByRole("button", { name: "Adicionar item" });
  await adicionar();
  expect(secao.queryByLabelText("Nome do item")).toBeNull();
  fireEvent.click(await adicionar());
  fireEvent.click(secao.getByRole("button", { name: "Cancelar" }));
  expect(secao.queryByLabelText("Nome do item")).toBeNull();
  fireEvent.click(await adicionar());
  fireEvent.change(await secao.findByLabelText("Nome do item"), {
    target: { value: " Cogumelo " },
  });
  fireEvent.change(secao.getByLabelText("Quantidade"), {
    target: { value: "2" },
  });
  fireEvent.change(secao.getByLabelText("Descrição (opcional)"), {
    target: { value: "Do bosque" },
  });
  fireEvent.click(secao.getByRole("button", { name: "Salvar item" }));
  expect(await secao.findByText("Cogumelo", { exact: true })).toBeTruthy();
  expect(secao.queryByLabelText("Nome do item")).toBeNull();
  expect(itens).toHaveBeenCalledWith(
    "/api/jogo/feral/3/itens-encontrados",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        nome: "Cogumelo",
        quantidade: 2,
        descricao: "Do bosque",
      }),
    }),
  );
  const aumentar = secao.getByRole("button", {
    name: "Aumentar quantidade de Cogumelo",
  });
  const diminuir = secao.getByRole("button", {
    name: "Diminuir quantidade de Cogumelo",
  });
  fireEvent.click(aumentar);
  expect(await secao.findByText("×3")).toBeTruthy();
  fireEvent.click(diminuir);
  expect(await secao.findByText("×2")).toBeTruthy();
  fireEvent.click(secao.getByRole("button", { name: "Editar Cogumelo" }));
  const edicao = within(secao.getByRole("form", { name: "Editar Cogumelo" }));
  fireEvent.change(edicao.getByLabelText("Nome do item"), {
    target: { value: "Cogumelo seco" },
  });
  fireEvent.change(edicao.getByLabelText("Quantidade"), {
    target: { value: "1" },
  });
  fireEvent.click(edicao.getByRole("button", { name: "Salvar alterações" }));
  expect(await secao.findByText("Cogumelo seco", { exact: true })).toBeTruthy();
  fireEvent.click(
    secao.getByRole("button", { name: "Remover Cogumelo seco do inventário" }),
  );
  expect(await secao.findByText("Item removido do inventário.")).toBeTruthy();
  expect(secao.queryByText("Cogumelo seco", { exact: true })).toBeNull();
  window.history.replaceState({}, "", "/utensilios?feral=5");
  tela.rerender(<Utensilios />);
  expect(await screen.findByText("Pedra lisa")).toBeTruthy();
  expect(screen.queryByText("Cogumelo seco", { exact: true })).toBeNull();
});

it("seleciona a ficha indicada e ajusta a durabilidade do utensílio escolhido na criação", async () => {
  window.history.replaceState({}, "", "/utensilios?feral=5");
  const equipado = {
    ...item,
    utensilio: {
      ...item.utensilio,
      estilos_principais: ["Poderoso", "Preciso"],
    },
  };
  const rede = simular()
    .mockResolvedValueOnce(sucesso(ferais))
    .mockResolvedValueOnce(sucesso([segundo, equipado]));
  render(<Utensilios />);
  expect(screen.getByText("Carregando fichas…")).toBeTruthy();
  await screen.findByRole("heading", { name: "Espeto" });
  expect(rede).toHaveBeenCalledWith(
    "/api/jogo/feral/5/inventario",
    expect.anything(),
  );
  expect(screen.queryByText("Criar utensílio pessoal")).toBeNull();
  expect(screen.queryByText("Adicionar ao inventário")).toBeNull();
  expect(screen.queryByLabelText("Feral ativo")).toBeNull();
  expect(
    screen.getByRole("link", { name: "Ver ficha" }).getAttribute("href"),
  ).toBe("/fichas/5");
  const inventario = within(
    screen.getByRole("region", { name: "Inventário do Feral" }),
  );
  const card = within(
    inventario.getByRole("heading", { name: "Cutelo" }).closest("article")!,
  );
  const ver = card.getByRole("button", { name: "Cutelo" });
  rede.mockResolvedValueOnce(
    sucesso({ ...equipado, estilo_escolhido: "Preciso" }),
  );
  fireEvent.click(card.getByRole("button", { name: "Preciso · 2 ou 3" }));
  expect(
    (await card.findByRole("button", { name: "Preciso · 3" })).getAttribute(
      "aria-pressed",
    ),
  ).toBe("true");
  expect(card.getByRole("button", { name: "Poderoso · 2" })).toBeTruthy();
  expect(rede).toHaveBeenLastCalledWith(
    "/api/jogo/feral/5/inventario/8/estilo",
    expect.objectContaining({
      method: "PUT",
      body: '{"estilo_escolhido":"Preciso"}',
    }),
  );
  fireEvent.mouseEnter(ver);
  expect(card.queryByRole("region")).toBeNull();
  fireEvent.click(ver);
  const previa = within(card.getByRole("region", { name: "Prévia de Cutelo" }));
  expect(previa.getByText("Corte")).toBeTruthy();
  expect(previa.getByText("Aparar")).toBeTruthy();
  fireEvent.click(ver);
  expect(card.queryByRole("region")).toBeNull();
  const buscar = screen.getByRole("searchbox");
  fireEvent.change(buscar, { target: { value: "inexistente" } });
  expect(screen.getByText("Nenhum utensílio encontrado.")).toBeTruthy();
  fireEvent.change(buscar, { target: { value: "aparar" } });
  const filtrado = within(
    inventario.getByRole("heading", { name: "Cutelo" }).closest("article")!,
  );
  rede.mockResolvedValueOnce(erro());
  fireEvent.click(filtrado.getByText("Ajustar durabilidade"));
  fireEvent.click(filtrado.getByText("Salvar durabilidade"));
  await screen.findByRole("alert");
  rede.mockResolvedValueOnce(
    sucesso({
      ...equipado,
      estilo_escolhido: "Preciso",
      durabilidade_atual: 0,
      se_quebrado: true,
    }),
  );
  fireEvent.change(filtrado.getByLabelText("Durabilidade atual"), {
    target: { value: "0" },
  });
  fireEvent.click(filtrado.getByText("Salvar durabilidade"));
  expect(await filtrado.findByText("Quebrado")).toBeTruthy();
  expect(filtrado.getByText("0 / 5")).toBeTruthy();
  fireEvent.click(filtrado.getByRole("button", { name: "Cutelo" }));
  expect(
    within(filtrado.getByRole("region")).getByText("Quebrado"),
  ).toBeTruthy();
  expect(within(filtrado.getByRole("region")).getByText("0 / 5")).toBeTruthy();
  expect(rede).toHaveBeenLastCalledWith(
    "/api/jogo/feral/5/inventario/8",
    expect.objectContaining({
      method: "PUT",
      body: '{"durabilidade_atual":0}',
    }),
  );
  window.history.replaceState({}, "", "/");
});

it("troca o destaque sem bloquear o card e salva a última escolha em ordem", async () => {
  const equipado = {
    ...item,
    utensilio: {
      ...item.utensilio,
      estilos_principais: ["Poderoso", "Preciso"],
    },
    estilo_escolhido: "Poderoso",
  };
  const primeira = deferred<Response>();
  const segunda = deferred<Response>();
  const rede = simular()
    .mockResolvedValueOnce(sucesso(ferais))
    .mockResolvedValueOnce(sucesso([equipado]))
    .mockReturnValueOnce(primeira.promise)
    .mockReturnValueOnce(segunda.promise);
  render(<Utensilios />);
  const preciso = await screen.findByRole("button", { name: "Preciso · 2" });
  const poderoso = screen.getByRole("button", { name: "Poderoso · 3" });
  preciso.focus();
  fireEvent.click(preciso);
  expect(preciso.getAttribute("aria-pressed")).toBe("true");
  expect(document.activeElement).toBe(preciso);
  expect(screen.getByRole("searchbox").matches(":disabled")).toBe(false);
  fireEvent.click(poderoso);
  expect(poderoso.getAttribute("aria-pressed")).toBe("true");
  expect(rede).toHaveBeenCalledTimes(3);

  await act(async () =>
    primeira.resolve(sucesso({ ...equipado, estilo_escolhido: "Preciso" })),
  );
  expect(poderoso.getAttribute("aria-pressed")).toBe("true");
  expect(rede).toHaveBeenLastCalledWith(
    "/api/jogo/feral/3/inventario/8/estilo",
    expect.objectContaining({ body: '{"estilo_escolhido":"Poderoso"}' }),
  );
  await act(async () => segunda.resolve(sucesso(equipado)));
  expect(screen.getByRole("button", { name: "Poderoso · 3" })).toBe(poderoso);

  rede.mockResolvedValueOnce(erro());
  fireEvent.click(preciso);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(poderoso.getAttribute("aria-pressed")).toBe("true");
});

it("abre apenas o catálogo e recebe novos cadastros ao voltar à aba", async () => {
  window.history.replaceState({}, "", "/utensilios");
  const nova = { ...catalogo[0], id: 93, nome: "Concha", durabilidade_max: 14 };
  const respostas = vi
    .fn()
    .mockReturnValueOnce(erro(503))
    .mockReturnValueOnce(sucesso([]))
    .mockReturnValueOnce(sucesso([...catalogo, nova]));
  const outrasConsultas = simular(respostas);
  render(<Utensilios />);
  const painel = within(
    screen.getByRole("region", { name: "Catálogo de utensílios" }),
  );
  expect(painel.getByText("Carregando catálogo…")).toBeTruthy();
  expect(screen.queryByText("Inventário do Feral")).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Atualizar catálogo" }),
  ).toBeNull();
  await painel.findByRole("alert");
  fireEvent(window, new Event("focus"));
  await painel.findByText("Nenhum utensílio cadastrado.");
  fireEvent(window, new Event("focus"));
  const concha = await painel.findByRole("button", { name: "Concha" });
  expect(painel.getByRole("button", { name: "Cutelo" })).toBeTruthy();
  fireEvent.click(concha);
  const previa = within(
    painel.getByRole("region", { name: "Prévia de Concha" }),
  );
  expect(previa.getByText("14 / 14")).toBeTruthy();
  expect(outrasConsultas).not.toHaveBeenCalled();
  expect(screen.queryByText("Salvar durabilidade")).toBeNull();
});

it("busca por nome, estilo ou técnica e apresenta as regras do modelo", async () => {
  window.history.replaceState({}, "", "/utensilios");
  const ferro = {
    ...catalogo[0],
    nome: "Cutelo",
    imagem_url: "https://res.cloudinary.com/exemplo/image/upload/cutelo.png",
    alcance: "1 (Golpe)",
    estilos_principais: ["Poderoso", "Preciso"] as [string, string],
    tecnicas: [{ id: 2, nome: "Corte Limpo", descricao: "4 ações." }],
  };
  const macarico = {
    ...catalogo[0],
    id: 20,
    nome: "Maçarico",
    durabilidade_max: 0,
  };
  simular(() => sucesso([macarico, ferro]));
  render(<Utensilios />);
  const cards = await screen.findAllByRole("article");
  expect(
    within(cards[0]).getByRole("heading", { name: ferro.nome }),
  ).toBeTruthy();
  const arte = within(cards[0]).getByRole("img");
  expect(arte.getAttribute("src")).toBe(ferro.imagem_url);
  const estilos = within(cards[0]).getByRole("group", {
    name: "Estilos principais",
  });
  expect(within(estilos).getByText("Poderoso · 2 ou 3")).toBeTruthy();
  expect(within(estilos).getByText("Preciso · 2 ou 3")).toBeTruthy();
  expect(within(cards[1]).getByRole("img").getAttribute("src")).toBe(
    imagensCloudinary.utensilios.macarico,
  );
  expect(
    cards[1].querySelector<HTMLElement>(".managed-utensil-durability i")?.style
      .width,
  ).toBe("0%");
  fireEvent.mouseEnter(arte.parentElement!);
  expect(within(cards[0]).queryByRole("region")).toBeNull();
  fireEvent.click(within(cards[0]).getByRole("button", { name: "Cutelo" }));
  expect(
    within(cards[0]).getByRole("region", { name: "Prévia de Cutelo" })
      .textContent,
  ).toContain("3 Poderoso e 2 Preciso ou 3 Preciso e 2 Poderoso");
  const busca = screen.getByRole("searchbox");
  for (const termo of ["  preciso ", "corte limpo", "poderoso", "cutelo"]) {
    fireEvent.change(busca, { target: { value: termo } });
    expect(screen.getByLabelText("1 de 2 utensílios")).toBeTruthy();
    expect(screen.getByRole("heading", { name: ferro.nome })).toBeTruthy();
  }
  fireEvent.change(busca, { target: { value: "macarico" } });
  expect(screen.getByRole("heading", { name: macarico.nome })).toBeTruthy();
  fireEvent.change(busca, { target: { value: "nenhum" } });
  expect(screen.getByText("Nenhum utensílio encontrado.")).toBeTruthy();
});

it("mostra somente alcance de Golpe para um Maçarico quebrado", async () => {
  const utensilio = {
    ...catalogo[0],
    nome: "Maçarico",
    alcance: "1 (Golpe), 3 (Tiro)",
    estilos_principais: ["Preciso", "Capcioso"],
  };
  simular()
    .mockResolvedValueOnce(sucesso(ferais))
    .mockResolvedValueOnce(
      sucesso([
        { ...item, utensilio, durabilidade_atual: 0, se_quebrado: true },
      ]),
    );
  render(<Utensilios />);
  expect(await screen.findByText("Alcance · 1 (Golpe)")).toBeTruthy();
  expect(screen.queryByText(/3 \(Tiro\)/)).toBeNull();
});

it.each([
  [[erro(401)], "Entrar novamente"],
  [[sucesso([])], "Criar ficha"],
  [[sucesso(ferais), erro()], "Operação recusada."],
] as const)(
  "trata o estado inicial do inventário %#",
  async (respostas, mensagem) => {
    const rede = simular();
    for (const resposta of respostas) rede.mockResolvedValueOnce(resposta);
    render(<Utensilios />);
    expect(await screen.findByText(mensagem)).toBeTruthy();
  },
);

it("abre e fecha a prévia por toque e teclado e mostra os dados de itens antigos", async () => {
  const antigo = {
    ...item,
    durabilidade_atual: 0,
    se_quebrado: null,
    utensilio: {
      ...catalogo[0],
      nome: "Item antigo",
      alcance: null,
      tecnicas: [],
    },
    tecnicas: [{ id: 8, nome: "Apoiar", descricao: null }],
  };
  simular()
    .mockResolvedValueOnce(sucesso(ferais))
    .mockResolvedValueOnce(sucesso([antigo]));
  render(<Utensilios />);
  const botao = await screen.findByRole("button", { name: "Item antigo" });
  fireEvent.click(botao);
  fireEvent.mouseLeave(botao.closest("article")!);
  expect(botao.getAttribute("aria-expanded")).toBe("true");
  const painel = screen.getByRole("region", { name: "Prévia de Item antigo" });
  for (const texto of [
    "Sem ilustração",
    "Não informado",
    "Quebrado",
    "Apoiar",
  ]) {
    expect(within(painel).getByText(texto)).toBeTruthy();
  }
  fireEvent.click(botao);
  expect(botao.getAttribute("aria-expanded")).toBe("false");
  fireEvent.focus(botao);
  fireEvent.keyDown(botao, { key: "Tab" });
  expect(botao.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(botao);
  expect(botao.getAttribute("aria-expanded")).toBe("true");
  fireEvent.keyDown(botao, { key: "Escape" });
  expect(botao.getAttribute("aria-expanded")).toBe("false");
  fireEvent.blur(botao);
});
it.each([true, false])(
  "descarta uma resposta tardia da ficha anterior (%s)",
  async (falhar) => {
    const antiga = deferred<Response>();
    simular()
      .mockResolvedValueOnce(sucesso(ferais))
      .mockReturnValueOnce(antiga.promise)
      .mockResolvedValueOnce(sucesso(ferais))
      .mockResolvedValueOnce(sucesso([segundo]));
    const tela = render(<Utensilios />);
    await screen.findByText("Carregando inventário…");
    window.history.replaceState({}, "", "/utensilios?feral=5");
    tela.rerender(<Utensilios />);
    await screen.findByRole("heading", { name: "Espeto" });
    await act(async () => {
      if (falhar) antiga.reject(new Error());
      else antiga.resolve(sucesso([]));
    });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("heading", { name: "Espeto" })).toBeTruthy();
  },
);
it("avisa quando o link aponta para uma ficha indisponível", async () => {
  window.history.replaceState({}, "", "/utensilios?feral=999");
  const rede = simular().mockResolvedValueOnce(sucesso(ferais));
  render(<Utensilios />);
  expect(await screen.findByText("Ficha não encontrada.")).toBeTruthy();
  expect(
    screen
      .getByRole("link", { name: "Ver minhas fichas" })
      .getAttribute("href"),
  ).toBe("/fichas");
  expect(rede).toHaveBeenCalledTimes(1);
});
it("edita os pontos e ativa um traço por ficha", async () => {
  const rede = simular().mockResolvedValueOnce(
    sucesso({
      estilos: [
        { id: 1, nome: "Preciso", valor: 2 },
        { id: 2, nome: "Sagaz", valor: 0 },
      ],
      habilidades: [],
      tracos: [
        { id: 7, nome: "Escalar", valor: 0, descricao: "Subir paredes" },
      ],
      condicoes: [],
    }),
  );
  render(<Atributos />);
  expect(screen.getByText("Carregando atributos…")).toBeTruthy();
  const pontos = await screen.findByLabelText("Preciso");
  fireEvent.change(pontos, { target: { value: "4" } });
  rede.mockResolvedValueOnce(erro());
  fireEvent.submit(pontos.closest("form")!);
  await screen.findByRole("alert");
  rede.mockResolvedValueOnce(sucesso({}));
  fireEvent.submit(pontos.closest("form")!);
  await screen.findByText("Atributo salvo.");
  expect(rede).toHaveBeenLastCalledWith(
    "/api/jogo/feral/3/atributos",
    expect.objectContaining({
      method: "PUT",
      body: '{"grupo":"estilos","id":1,"valor":4}',
    }),
  );
  fireEvent.change(screen.getByLabelText("Grupo"), {
    target: { value: "habilidades" },
  });
  expect(
    screen.getByText("Nenhum atributo cadastrado neste grupo."),
  ).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Grupo"), {
    target: { value: "tracos" },
  });
  expect(screen.getByText("Subir paredes")).toBeTruthy();
  const ativo = screen.getByLabelText("Escalar");
  fireEvent.change(ativo, { target: { value: "1" } });
  const busca = screen.getByRole("searchbox", { name: "Buscar atributos" });
  fireEvent.change(busca, { target: { value: "   PÁREDES " } });
  expect(screen.getByRole("heading", { name: "Escalar" })).toBeTruthy();
  fireEvent.change(busca, { target: { value: "inexistente" } });
  expect(screen.getByText("Nenhum atributo encontrado.")).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Escalar" })).toBeNull();
  fireEvent.change(busca, { target: { value: "ESCALAR" } });
  expect(
    screen.getByRole<HTMLSelectElement>("combobox", { name: "Escalar" }).value,
  ).toBe("1");
  rede.mockResolvedValueOnce(sucesso({}));
  fireEvent.submit(ativo.closest("form")!);
  await screen.findByText("Atributo salvo.");
  expect(rede).toHaveBeenLastCalledWith(
    "/api/jogo/feral/3/atributos",
    expect.objectContaining({ body: '{"grupo":"tracos","id":7,"valor":1}' }),
  );
});
it("mostra falha ao abrir os atributos", async () => {
  simular().mockRejectedValueOnce(new Error());
  render(<Atributos />);
  expect((await screen.findByRole("alert")).textContent).toBe(
    "Não foi possível acessar a API.",
  );
});
