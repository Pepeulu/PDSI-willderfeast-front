import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Sheet from "@/app/fichas/[id]/page";
import { ApiError, createFeral, deleteFeral, getFeral, type Feral } from "@/lib/api";

const navigation = vi.hoisted(() => ({
  id: "7",
  router: { push: vi.fn(), refresh: vi.fn(), replace: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: navigation.id }),
  useRouter: () => navigation.router,
}));

vi.mock("@/components/DashboardShell", () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api")>(),
  createFeral: vi.fn(),
  deleteFeral: vi.fn(),
  getFeral: vi.fn(),
}));

const feral: Feral = {
  id: 7,
  usuario_id: 2,
  nome: "Askell",
  titulo: "O Alquímico",
  especialidade: "Cozinha de campo",
  imagem_url: "https://example.com/askell.jpg",
  vigor_atual: 5,
  vigor_max: 10,
  voce_e: "Um viajante",
  tenta_ser: null,
  feras_familiares: null,
  prato_tipico: null,
  tempero_tipico: null,
  infancia_criacao: null,
  iniciacao_como_feral: null,
  ambicao: null,
  conexao: null,
};

function changeField(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function createSheet() {
  navigation.id = "novo";
  render(<Sheet />);
  expect(screen.getByRole("heading", { name: "Criar ficha" })).toBeTruthy();
}

beforeEach(() => {
  navigation.id = "7";
  vi.resetAllMocks();
});

describe("criação de ficha", () => {
  it("exige um nome que não seja composto apenas de espaços", () => {
    createSheet();
    changeField("Nome do Feral *", "   ");
    fireEvent.click(screen.getByRole("button", { name: "CRIAR FICHA" }));

    expect(screen.getByRole("alert").textContent).toBe("Informe o nome do Feral.");
    expect(createFeral).not.toHaveBeenCalled();
  });

  it.each([
    ["máximo fracionário", "10.5", "5"],
    ["atual fracionário", "10", "5.5"],
    ["máximo abaixo de um", "0", "0"],
    ["atual negativo", "10", "-1"],
    ["atual acima do máximo", "10", "11"],
  ])("rejeita vigor %s", (_scenario, max, current) => {
    createSheet();
    changeField("Nome do Feral *", "Askell");
    changeField("Vigor máximo *", max);
    changeField("Vigor atual *", current);
    fireEvent.click(screen.getByRole("button", { name: "CRIAR FICHA" }));

    expect(screen.getByRole("alert").textContent).toBe(
      "Informe valores inteiros de vigor. O vigor atual não pode superar o vigor máximo.",
    );
    expect(createFeral).not.toHaveBeenCalled();
  });

  it("normaliza os campos, desabilita o botão durante o envio e volta para a lista", async () => {
    let finish!: (data: Feral) => void;
    vi.mocked(createFeral).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    createSheet();
    const fields = {
      "Nome do Feral *": "  Askell  ",
      "Título": "  O Alquímico  ",
      "Especialidade": "  Cozinha de campo  ",
      "URL da imagem": "https://example.com/askell.jpg",
      "Vigor máximo *": "12",
      "Vigor atual *": "0",
      "Você é": "  Um viajante  ",
      "Tenta ser": "  Um guia  ",
      "Feras familiares": "  Lobos da serra  ",
      "Prato típico": "  Ensopado  ",
      "Tempero típico": "  Pimenta  ",
      "Infância e criação": "  Cresceu na mata  ",
      "Iniciação como Feral": "  Aprendeu com a família  ",
      "Ambição": "  Explorar a serra  ",
      "Conexão": "   ",
    };
    for (const [label, value] of Object.entries(fields)) {
      changeField(label, value);
    }

    expect(screen.getByLabelText("URL da imagem").getAttribute("type")).toBe("url");
    fireEvent.click(screen.getByRole("button", { name: "CRIAR FICHA" }));

    expect(screen.getByRole("button", { name: "SALVANDO..." }).hasAttribute("disabled")).toBe(true);
    expect(createFeral).toHaveBeenCalledExactlyOnceWith({
      ambicao: "Explorar a serra",
      conexao: null,
      especialidade: "Cozinha de campo",
      feras_familiares: "Lobos da serra",
      imagem_url: "https://example.com/askell.jpg",
      infancia_criacao: "Cresceu na mata",
      iniciacao_como_feral: "Aprendeu com a família",
      nome: "Askell",
      prato_tipico: "Ensopado",
      tempero_tipico: "Pimenta",
      tenta_ser: "Um guia",
      titulo: "O Alquímico",
      vigor_atual: 0,
      vigor_max: 12,
      voce_e: "Um viajante",
    });

    await act(async () => finish(feral));

    expect(navigation.router.push).toHaveBeenCalledExactlyOnceWith("/fichas");
    expect(navigation.router.refresh).toHaveBeenCalledTimes(1);
  });

  it("mostra a falha da API e permite uma nova tentativa", async () => {
    vi.mocked(createFeral).mockRejectedValue(new ApiError("Ficha duplicada", 409));
    createSheet();
    changeField("Nome do Feral *", "Askell");
    fireEvent.click(screen.getByRole("button", { name: "CRIAR FICHA" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Ficha duplicada");
    expect(screen.getByRole("button", { name: "CRIAR FICHA" }).hasAttribute("disabled")).toBe(false);
    expect(navigation.router.push).not.toHaveBeenCalled();
  });

  it("limpa a sessão e preserva o destino quando o envio recebe 401", async () => {
    localStorage.setItem("wilderfeast_user", "usuario");
    vi.mocked(createFeral).mockRejectedValue(new ApiError("Sessão expirada", 401));
    createSheet();
    changeField("Nome do Feral *", "Askell");
    fireEvent.click(screen.getByRole("button", { name: "CRIAR FICHA" }));

    await waitFor(() => expect(navigation.router.replace).toHaveBeenCalledExactlyOnceWith("/login?next=/fichas/novo"));
    expect(localStorage.getItem("wilderfeast_user")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("detalhe de ficha", () => {
  it("mostra o carregamento e depois renderiza a ficha com os links correspondentes", async () => {
    vi.mocked(getFeral).mockResolvedValue(feral);
    render(<Sheet />);

    expect(screen.getByLabelText("Carregando ficha")).toBeTruthy();
    expect((await screen.findByRole("heading", { name: "Askell" })).tagName).toBe("H1");
    expect(getFeral).toHaveBeenCalledExactlyOnceWith(7);
    expect(screen.getByText("FICHA DO FERAL · #007")).toBeTruthy();
    expect(screen.getByText("VIGOR 5 / 10")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Retrato de Askell" }).getAttribute("src")).toBe(feral.imagem_url);
    expect(screen.getByRole("link", { name: "EDITAR PERFIL" }).getAttribute("href")).toBe("/perfil?feral=7");
    expect(screen.getByText("Um viajante")).toBeTruthy();
    expect(screen.getAllByText("Não informado")).toHaveLength(8);
  });

  it("exibe a imagem e os textos padrão quando a ficha não tem esses dados", async () => {
    vi.mocked(getFeral).mockResolvedValue({
      ...feral,
      titulo: null,
      especialidade: null,
      imagem_url: null,
    });
    render(<Sheet />);

    expect(await screen.findByRole("heading", { name: "Feral sem título" })).toBeTruthy();
    expect(screen.getByText("Especialidade não definida")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Retrato de Askell" }).getAttribute("src")).toBe("/assets/wilders.jpg");
  });

  it("mostra a indisponibilidade da ficha quando a consulta falha", async () => {
    vi.mocked(getFeral).mockRejectedValue(new Error("Falha de rede"));
    render(<Sheet />);

    expect(await screen.findByRole("heading", { name: "Ficha indisponível" })).toBeTruthy();
    expect(screen.getByText("Não foi possível carregar a ficha.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "VOLTAR PARA FICHAS" }).getAttribute("href")).toBe("/fichas");
  });

  it("limpa a sessão e redireciona para autenticação quando a consulta recebe 401", async () => {
    localStorage.setItem("wilderfeast_user", "usuario");
    vi.mocked(getFeral).mockRejectedValue(new ApiError("Sessão expirada", 401));
    render(<Sheet />);

    await waitFor(() => expect(screen.queryByLabelText("Carregando ficha")).toBeNull());
    expect(navigation.router.replace).toHaveBeenCalledExactlyOnceWith("/login?next=/fichas/7");
    expect(localStorage.getItem("wilderfeast_user")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Ficha indisponível" })).toBeNull();
  });

  it.each(["sucesso", "erro"])("ignora o %s da consulta após navegar para outra ficha", async (outcome) => {
    let settle!: () => void;
    vi.mocked(getFeral).mockReturnValueOnce(new Promise((resolve, reject) => {
      settle = outcome === "sucesso"
        ? () => resolve(feral)
        : () => reject(new Error("Falha na primeira consulta"));
    }));
    const nextFeral = { ...feral, id: 8, nome: "Naila" };
    vi.mocked(getFeral).mockResolvedValueOnce(nextFeral);
    const view = render(<Sheet />);

    navigation.id = "8";
    view.rerender(<Sheet />);
    expect(await screen.findByRole("heading", { name: "Naila" })).toBeTruthy();
    await act(async () => settle());

    expect(screen.getByRole("heading", { name: "Naila" })).toBeTruthy();
    expect(screen.queryByText("Não foi possível carregar a ficha.")).toBeNull();
  });

  it("só exclui com confirmação e volta para as fichas após a exclusão", async () => {
    vi.mocked(getFeral).mockResolvedValue(feral);
    let finish!: (data: { ok: true }) => void;
    vi.mocked(deleteFeral).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<Sheet />);
    const button = await screen.findByRole("button", { name: "EXCLUIR FICHA" });

    fireEvent.click(button);
    expect(deleteFeral).not.toHaveBeenCalled();
    fireEvent.click(button);

    expect(confirm).toHaveBeenLastCalledWith("Excluir definitivamente a ficha de Askell?");
    expect(deleteFeral).toHaveBeenCalledExactlyOnceWith(7);
    expect(screen.getByRole("button", { name: "EXCLUINDO..." }).hasAttribute("disabled")).toBe(true);

    await act(async () => finish({ ok: true }));
    expect(navigation.router.replace).toHaveBeenCalledExactlyOnceWith("/fichas");
    expect(navigation.router.refresh).toHaveBeenCalledTimes(1);
  });

  it("preserva a ficha e reabilita o botão se a exclusão falhar", async () => {
    vi.mocked(getFeral).mockResolvedValue(feral);
    vi.mocked(deleteFeral).mockRejectedValue(new Error("Falha de rede"));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<Sheet />);
    fireEvent.click(await screen.findByRole("button", { name: "EXCLUIR FICHA" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Não foi possível excluir a ficha.");
    expect(screen.getByRole("heading", { name: "Askell" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "EXCLUIR FICHA" }).hasAttribute("disabled")).toBe(false);
    expect(navigation.router.replace).not.toHaveBeenCalled();
  });
});
