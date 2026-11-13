import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Perfil from "@/app/perfil/page";
import { ApiError, getMyFerais, updateFeral, type Feral } from "@/lib/api";

const router = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));

vi.mock("@/components/DashboardShell", () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api")>(),
  getMyFerais: vi.fn(),
  updateFeral: vi.fn(),
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
  tenta_ser: "Um amigo",
  feras_familiares: "Lobos",
  prato_tipico: "Sopa de raiz",
  tempero_tipico: "Pimenta",
  infancia_criacao: "Cresceu na mata",
  iniciacao_como_feral: "Aprendeu com a família",
  ambicao: "Conhecer o mar",
  conexao: "Naila",
};

const feralWithoutProfile: Feral = {
  ...feral,
  id: 8,
  nome: "Naila",
  titulo: null,
  especialidade: null,
  imagem_url: null,
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

function changeField(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

async function openProfile(...ferais: Feral[]) {
  vi.mocked(getMyFerais).mockResolvedValue(ferais);
  const view = render(<Perfil />);
  const saveButton = await screen.findByRole("button", { name: "SALVAR ALTERAÇÕES" });
  return { ...view, saveButton };
}

beforeEach(() => {
  window.history.replaceState(null, "", "/perfil");
  vi.resetAllMocks();
});

describe("carregamento do perfil", () => {
  it("mostra o carregamento e oferece criar uma ficha quando a lista está vazia", async () => {
    vi.mocked(getMyFerais).mockResolvedValue([]);
    render(<Perfil />);

    expect(screen.getByLabelText("Carregando perfil")).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "Você ainda não possui um Feral" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "CRIAR FICHA" }).getAttribute("href")).toBe("/fichas/novo");
    expect(screen.queryByLabelText("Feral ativo")).toBeNull();
  });

  it("seleciona o Feral solicitado e preenche os dados ao trocar de ficha", async () => {
    window.history.replaceState(null, "", "/perfil?feral=8");
    await openProfile(feral, feralWithoutProfile);

    const selector = screen.getByLabelText<HTMLSelectElement>("Feral ativo");
    expect(selector.value).toBe("8");
    expect(screen.getByLabelText<HTMLInputElement>("Título").value).toBe("");
    expect(screen.getByText("Área para imagem do Feral")).toBeTruthy();
    expect(screen.getByRole("link", { name: "VER FICHA COMPLETA" }).getAttribute("href")).toBe("/fichas/8");

    changeField("Feral ativo", "7");
    expect(selector.value).toBe("7");
    expect(screen.getByLabelText<HTMLInputElement>("Nome *").value).toBe("Askell");
    expect(screen.getByLabelText<HTMLInputElement>("Título").value).toBe("O Alquímico");
    expect(screen.getByRole("img", { name: "Imagem de Askell" }).getAttribute("src")).toBe(feral.imagem_url);
    expect(screen.getByRole("link", { name: "VER FICHA COMPLETA" }).getAttribute("href")).toBe("/fichas/7");

    changeField("Feral ativo", "99");
    expect(screen.getByLabelText<HTMLInputElement>("Nome *").value).toBe("Askell");
    expect(screen.getByRole("link", { name: "VER FICHA COMPLETA" }).getAttribute("href")).toBe("/fichas/7");
  });

  it("mostra a falha de carregamento e impede salvar sem Feral ativo", async () => {
    vi.mocked(getMyFerais).mockRejectedValue(new Error("Falha de rede"));
    render(<Perfil />);
    const saveButton = await screen.findByRole("button", { name: "SALVAR ALTERAÇÕES" });

    expect(screen.getAllByRole("alert").map((alert) => alert.textContent)).toContain("Não foi possível carregar o perfil.");
    expect(screen.queryByRole("link", { name: "VER FICHA COMPLETA" })).toBeNull();
    changeField("Nome *", "Askell");
    changeField("Vigor atual *", "5");
    changeField("Vigor máximo *", "10");
    fireEvent.click(saveButton);

    expect(updateFeral).not.toHaveBeenCalled();
  });

  it("limpa a sessão e preserva a rota de retorno se a consulta recebe 401", async () => {
    localStorage.setItem("wilderfeast_user", "usuario");
    vi.mocked(getMyFerais).mockRejectedValue(new ApiError("Sessão expirada", 401));
    render(<Perfil />);

    await waitFor(() => expect(router.replace).toHaveBeenCalledExactlyOnceWith("/login?next=/perfil"));
    expect(localStorage.getItem("wilderfeast_user")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it.each(["sucesso", "erro"])("ignora o %s de uma consulta de uma página já fechada", async (outcome) => {
    let settle!: () => void;
    vi.mocked(getMyFerais).mockReturnValueOnce(new Promise((resolve, reject) => {
      settle = outcome === "sucesso"
        ? () => resolve([feral])
        : () => reject(new Error("Falha na primeira consulta"));
    }));
    const originalView = render(<Perfil />);

    originalView.unmount();
    await openProfile(feralWithoutProfile);
    await act(async () => settle());

    expect(screen.getByLabelText<HTMLInputElement>("Nome *").value).toBe("Naila");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("edição do perfil", () => {
  it.each([
    ["nome em branco", "   ", "10", "5"],
    ["máximo fracionário", "Askell", "10.5", "5"],
    ["atual fracionário", "Askell", "10", "5.5"],
    ["máximo abaixo de um", "Askell", "0", "0"],
    ["atual negativo", "Askell", "10", "-1"],
    ["atual acima do máximo", "Askell", "10", "11"],
  ])("rejeita %s", async (_scenario, name, max, current) => {
    const { container } = await openProfile(feral);
    changeField("Nome *", name);
    changeField("Vigor máximo *", max);
    changeField("Vigor atual *", current);
    // Envia diretamente para exercitar a validação do app além dos limites nativos do formulário.
    fireEvent.submit(container.querySelector("form")!);

    expect(screen.getByRole("alert").textContent).toBe(
      "Informe o nome e valores válidos de vigor. O vigor atual não pode superar o máximo.",
    );
    expect(updateFeral).not.toHaveBeenCalled();
  });

  it("envia todos os campos, atualiza apenas o Feral escolhido e recarrega os valores devolvidos", async () => {
    let finish!: (data: Feral) => void;
    vi.mocked(updateFeral).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const { saveButton } = await openProfile(feral, feralWithoutProfile);

    changeField("Nome *", "");
    expect(screen.getByRole("img", { name: "Imagem de Feral" })).toBeTruthy();

    const edits = {
      "Nome *": "  Astrid  ",
      "Título": "  Desbravadora  ",
      "Especialidade": "  Cozinha  ",
      "Vigor atual *": "0",
      "Vigor máximo *": "12",
      "URL da imagem": "https://example.com/astrid.jpg",
      "Você é": "  Uma viajante  ",
      "Mas você tenta ser": "  Uma guia  ",
      "Feras familiares": "  Corujas  ",
      "Prato típico": "  Caldo  ",
      "Tempero típico": "  Sal  ",
      "Infância e criação": "  No litoral  ",
      "Iniciação como Feral": "  Treinou em alto mar  ",
      "Ambição": "  Atravessar o oceano  ",
      "Conexão": "   ",
    };

    for (const [label, value] of Object.entries(edits)) {
      changeField(label, value);
    }
    fireEvent.click(saveButton);

    const payload = {
      ambicao: "Atravessar o oceano",
      conexao: null,
      especialidade: "Cozinha",
      feras_familiares: "Corujas",
      imagem_url: "https://example.com/astrid.jpg",
      infancia_criacao: "No litoral",
      iniciacao_como_feral: "Treinou em alto mar",
      nome: "Astrid",
      prato_tipico: "Caldo",
      tempero_tipico: "Sal",
      tenta_ser: "Uma guia",
      titulo: "Desbravadora",
      vigor_atual: 0,
      vigor_max: 12,
      voce_e: "Uma viajante",
    };
    expect(updateFeral).toHaveBeenCalledExactlyOnceWith(7, payload);
    expect(screen.getByRole("button", { name: "SALVANDO..." }).hasAttribute("disabled")).toBe(true);

    await act(async () => finish({ ...feral, ...payload, nome: "Astrid da Costa" }));

    expect(screen.getByRole("status").textContent).toBe("Perfil atualizado com sucesso na API.");
    expect(screen.getByRole("option", { name: "Astrid da Costa" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Naila" })).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>("Nome *").value).toBe("Astrid da Costa");
    expect(screen.getByLabelText<HTMLTextAreaElement>("Conexão").value).toBe("");

    changeField("Feral ativo", "8");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("mantém a edição disponível e exibe a falha quando o salvamento dá erro", async () => {
    vi.mocked(updateFeral).mockRejectedValue(new ApiError("Erro ao atualizar os dados", 400));
    const { saveButton } = await openProfile(feral, feralWithoutProfile);
    fireEvent.click(saveButton);

    expect((await screen.findByRole("alert")).textContent).toBe("Erro ao atualizar os dados");
    expect(saveButton.hasAttribute("disabled")).toBe(false);
    expect(screen.queryByRole("status")).toBeNull();

    changeField("Feral ativo", "8");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("limpa a sessão e preserva o Feral ativo no redirecionamento se o salvamento recebe 401", async () => {
    localStorage.setItem("wilderfeast_user", "usuario");
    vi.mocked(updateFeral).mockRejectedValue(new ApiError("Sessão expirada", 401));
    const { saveButton } = await openProfile(feral);
    fireEvent.click(saveButton);

    await waitFor(() => expect(router.replace).toHaveBeenCalledExactlyOnceWith("/login?next=/perfil?feral=7"));
    expect(localStorage.getItem("wilderfeast_user")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
