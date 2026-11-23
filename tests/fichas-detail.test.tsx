/**
 * Verifica criação, consulta e exclusão de fichas na rota de detalhe.
 * @module
 */

import imagensCloudinary from "@/lib/imagens-cloudinary.json";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Sheet from "@/app/fichas/[id]/page";
import { feralAtivoId, salvarFeralAtivo } from "@/lib/feral-ativo";
import {
  ApiError,
  createFeral,
  deleteFeral,
  enviarImagemFeral,
  getFeral,
  request,
  type Feral,
} from "@/lib/api";

/** Simula o parâmetro da rota e registra chamadas de navegação. */
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
  ...(await importOriginal<typeof import("@/lib/api")>()),
  createFeral: vi.fn(),
  deleteFeral: vi.fn(),
  enviarImagemFeral: vi.fn(),
  getFeral: vi.fn(),
  request: vi.fn(),
}));

/** Ficha de referência com imagem e campos opcionais ausentes. */
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

/** Altera um campo do formulário a partir do seu rótulo. */
function changeField(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function avancar() {
  fireEvent.click(screen.getByRole("button", { name: "Avançar" }));
}

/** Abre a rota de criação e confirma que o formulário está visível. */
async function createSheet() {
  navigation.id = "novo";
  render(<Sheet />);
  await screen.findByRole("radio", { name: "Espeto" });
}

beforeEach(() => {
  navigation.id = "7";
  vi.resetAllMocks();
  vi.mocked(request).mockResolvedValue([
    {
      id: 9,
      nome: "Cutelo",
      alcance: "1 (Golpear)",
      durabilidade_max: 20,
      tecnicas: [],
    },
    {
      id: 15,
      nome: "Espeto",
      alcance: "1 (Golpear)",
      durabilidade_max: 20,
      tecnicas: [],
    },
  ]);
});

describe("criação de ficha", () => {
  it("envia o arquivo só na última etapa e reaproveita a URL se salvar a ficha falhar", async () => {
    const url = "https://imagem.test/feral.png";
    vi.mocked(enviarImagemFeral).mockResolvedValueOnce(url);
    vi.mocked(createFeral)
      .mockRejectedValueOnce(new ApiError("Tente salvar novamente", 503))
      .mockResolvedValueOnce(feral);
    await createSheet();
    const input = screen.getByLabelText("Imagem");
    expect(screen.queryByLabelText("URL da imagem")).toBeNull();
    const arquivo = new File(["foto"], "retrato.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: null } });
    fireEvent.change(input, { target: { files: [] } });
    fireEvent.change(input, { target: { files: [arquivo] } });
    fireEvent.click(
      screen.getByRole("button", { name: "Remover foto selecionada" }),
    );
    fireEvent.change(input, { target: { files: [arquivo] } });
    changeField("Nome do Feral *", "Lia");
    fireEvent.click(screen.getByRole("radio", { name: "Espeto" }));
    avancar();
    avancar();
    expect(enviarImagemFeral).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "CRIAR FICHA" }));
    await screen.findByText("Tente salvar novamente");
    fireEvent.click(screen.getByRole("button", { name: "CRIAR FICHA" }));
    await waitFor(() =>
      expect(navigation.router.push).toHaveBeenCalledWith("/fichas"),
    );
    expect(enviarImagemFeral).toHaveBeenCalledExactlyOnceWith(arquivo);
    expect(createFeral).toHaveBeenLastCalledWith(
      expect.objectContaining({ imagem_url: url }),
    );
  });
  it("atualiza as opções ao voltar ao formulário e salva o ID do novo cadastro", async () => {
    await createSheet();
    changeField("Nome do Feral *", "Lia");
    fireEvent.click(screen.getByRole("radio", { name: "Espeto" }));
    vi.mocked(request).mockResolvedValueOnce([
      {
        id: 93,
        nome: "Concha",
        alcance: null,
        durabilidade_max: 14,
        tecnicas: [],
      },
    ]);
    fireEvent(window, new Event("focus"));
    const nova = await screen.findByRole("radio", { name: "Concha" });
    expect(screen.queryByRole("radio", { name: "Espeto" })).toBeNull();
    avancar();
    expect(createFeral).not.toHaveBeenCalled();
    fireEvent.click(nova);
    avancar();
    avancar();
    fireEvent.click(screen.getByRole("button", { name: "CRIAR FICHA" }));
    expect(createFeral).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ nome: "Lia", utensilio_id: 93 }),
    );
  });
  it("exige que o jogador escolha o utensílio e lista as opções da API", async () => {
    await createSheet();
    expect(request).toHaveBeenCalledWith("/api/jogo/utensilio");
    expect(screen.queryByRole("radio", { checked: true })).toBeNull();
    const cutelo = screen.getByRole("radio", { name: "Cutelo" });
    const espeto = screen.getByRole("radio", { name: "Espeto" });
    fireEvent.mouseEnter(cutelo.closest("label")!);
    expect(screen.queryByRole("region")).toBeNull();
    expect(screen.queryByRole("radio", { checked: true })).toBeNull();
    fireEvent.focus(espeto);
    expect(screen.queryByRole("region")).toBeNull();
    changeField("Nome do Feral *", "Askell");
    avancar();
    expect(
      await screen.findByText("Selecione o utensílio inicial do Feral."),
    ).toBeTruthy();
    expect(createFeral).not.toHaveBeenCalled();
  });

  it("mantém o rascunho durante uma falha ou catálogo vazio e permite recarregar", async () => {
    vi.mocked(request)
      .mockRejectedValueOnce(new ApiError("Catálogo indisponível", 503))
      .mockResolvedValueOnce([]);
    navigation.id = "novo";
    render(<Sheet />);
    expect(screen.getByText("Carregando utensílios…")).toBeTruthy();
    changeField("Nome do Feral *", "Lia");
    await screen.findByText("Catálogo indisponível");
    fireEvent.click(screen.getByText("Recarregar catálogo"));
    await screen.findByText("Nenhum utensílio inicial disponível.");
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Avançar" })
        .disabled,
    ).toBe(true);
    fireEvent.click(screen.getByText("Recarregar catálogo"));
    await screen.findByRole("radio", { name: "Espeto" });
    expect(
      screen.getByLabelText<HTMLInputElement>("Nome do Feral *").value,
    ).toBe("Lia");
  });

  it("exige um nome que não seja composto apenas de espaços", async () => {
    await createSheet();
    changeField("Nome do Feral *", "   ");
    avancar();

    expect(screen.getByRole("alert").textContent).toBe(
      "Informe o nome do Feral.",
    );
    expect(createFeral).not.toHaveBeenCalled();
  });

  it.each([
    ["vigor atual vazio", "10", ""],
    ["máximo fracionário", "10.5", "5"],
    ["atual fracionário", "10", "5.5"],
    ["máximo abaixo de um", "0", "0"],
    ["atual negativo", "10", "-1"],
    ["atual acima do máximo", "10", "11"],
  ])("rejeita vigor %s", async (_scenario, max, current) => {
    await createSheet();
    changeField("Nome do Feral *", "Askell");
    fireEvent.click(screen.getByRole("radio", { name: "Espeto" }));
    avancar();
    changeField("Vigor máximo *", max);
    changeField("Vigor atual *", current);
    avancar();

    expect(screen.getByRole("alert").textContent).toBe(
      "Informe valores inteiros de vigor. O vigor atual não pode superar o vigor máximo.",
    );
    expect(createFeral).not.toHaveBeenCalled();
  });

  it("normaliza os campos, desabilita o botão durante o envio e volta para a lista", async () => {
    let finish!: (data: Feral) => void;
    vi.mocked(createFeral).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    await createSheet();
    fireEvent.click(screen.getByRole("radio", { name: "Espeto" }));
    fireEvent.mouseEnter(
      screen.getByRole("radio", { name: "Cutelo" }).closest("label")!,
    );
    expect(
      screen.queryByRole("region", { name: "Prévia de Cutelo" }),
    ).toBeNull();
    expect(
      screen.getByRole("region", { name: "Prévia de Espeto" }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("img", { name: "Ilustração de Espeto" })
        .getAttribute("src"),
    ).toBe(imagensCloudinary.utensilios.espeto);
    expect(screen.getByText("20 / 20")).toBeTruthy();
    const identidade = {
      "Nome do Feral *": "  Askell  ",
      Título: "  O Alquímico  ",
      Especialidade: "  Cozinha de campo  ",
    };
    const perfil = {
      "Vigor máximo *": "12",
      "Vigor atual *": "0",
      "Você é": "  Um viajante  ",
      "Tenta ser": "  Um guia  ",
      "Feras familiares": "  Lobos da serra  ",
      "Prato típico": "  Ensopado  ",
      "Tempero típico": "  Pimenta  ",
    };
    const historia = {
      "Infância e criação": "  Cresceu na mata  ",
      "Iniciação como Feral": "  Aprendeu com a família  ",
      Ambição: "  Explorar a serra  ",
      Conexão: "   ",
    };
    expect(
      screen.queryByRole("heading", { name: "Perfil do Feral" }),
    ).toBeNull();
    for (const [label, value] of Object.entries(identidade))
      changeField(label, value);
    avancar();
    expect(screen.getByText("Etapa 2 de 3")).toBeTruthy();
    for (const [label, value] of Object.entries(perfil))
      changeField(label, value);
    avancar();
    expect(screen.getByText("Etapa 3 de 3")).toBeTruthy();
    for (const [label, value] of Object.entries(historia))
      changeField(label, value);
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByLabelText<HTMLInputElement>("Vigor atual *").value).toBe(
      "0",
    );
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(
      screen.getByRole("radio", { name: "Espeto", checked: true }),
    ).toBeTruthy();
    expect(
      screen.getByLabelText<HTMLInputElement>("Nome do Feral *").value,
    ).toBe("  Askell  ");
    avancar();
    avancar();
    expect(screen.getByLabelText<HTMLTextAreaElement>("Ambição").value).toBe(
      "  Explorar a serra  ",
    );
    expect(createFeral).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "CRIAR FICHA" }));

    expect(
      screen
        .getByRole("button", { name: "SALVANDO..." })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(createFeral).toHaveBeenCalledExactlyOnceWith({
      utensilio_id: 15,
      ambicao: "Explorar a serra",
      conexao: null,
      especialidade: "Cozinha de campo",
      feras_familiares: "Lobos da serra",
      imagem_url: null,
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
    vi.mocked(createFeral).mockRejectedValue(
      new ApiError("Ficha duplicada", 409),
    );
    await createSheet();
    changeField("Nome do Feral *", "Askell");
    fireEvent.click(screen.getByRole("radio", { name: "Cutelo" }));
    avancar();
    avancar();
    fireEvent.click(screen.getByRole("button", { name: "CRIAR FICHA" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Ficha duplicada",
    );
    expect(
      screen
        .getByRole("button", { name: "CRIAR FICHA" })
        .hasAttribute("disabled"),
    ).toBe(false);
    expect(navigation.router.push).not.toHaveBeenCalled();
  });

  it("limpa a sessão e preserva o destino quando o envio recebe 401", async () => {
    localStorage.setItem("wilderfeast_user", "usuario");
    vi.mocked(createFeral).mockRejectedValue(
      new ApiError("Sessão expirada", 401),
    );
    await createSheet();
    changeField("Nome do Feral *", "Askell");
    fireEvent.click(screen.getByRole("radio", { name: "Cutelo" }));
    avancar();
    avancar();
    fireEvent.click(screen.getByRole("button", { name: "CRIAR FICHA" }));

    await waitFor(() =>
      expect(navigation.router.replace).toHaveBeenCalledExactlyOnceWith(
        "/login?next=/fichas/novo",
      ),
    );
    expect(localStorage.getItem("wilderfeast_user")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("detalhe de ficha", () => {
  it("mostra o carregamento e depois renderiza a ficha com os links correspondentes", async () => {
    vi.mocked(getFeral).mockResolvedValue({
      ...feral,
      inventario: [{ id: 11, nome: "Panela" }],
    });
    render(<Sheet />);

    expect(screen.getByLabelText("Carregando ficha")).toBeTruthy();
    expect(
      (await screen.findByRole("heading", { name: "Askell" })).tagName,
    ).toBe("H1");
    expect(getFeral).toHaveBeenCalledExactlyOnceWith(7);
    expect(screen.getByText("FICHA DO FERAL · #007")).toBeTruthy();
    expect(screen.getByText("VIGOR 5 / 10")).toBeTruthy();
    expect(screen.getByText("Utensílio · Panela")).toBeTruthy();
    expect(
      screen
        .getByRole("img", { name: "Retrato de Askell" })
        .getAttribute("src"),
    ).toBe(feral.imagem_url);
    expect(
      screen.getByRole("link", { name: "EDITAR PERFIL" }).getAttribute("href"),
    ).toBe("/perfil?feral=7");
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

    expect(
      await screen.findByRole("heading", { name: "Feral sem título" }),
    ).toBeTruthy();
    expect(screen.getByText("Especialidade não definida")).toBeTruthy();
    expect(
      screen
        .getByRole("img", { name: "Retrato de Askell" })
        .getAttribute("src"),
    ).toBe(imagensCloudinary.interface.wilders);
  });

  it("mostra a indisponibilidade da ficha quando a consulta falha", async () => {
    vi.mocked(getFeral).mockRejectedValue(new Error("Falha de rede"));
    render(<Sheet />);

    expect(
      await screen.findByRole("heading", { name: "Ficha indisponível" }),
    ).toBeTruthy();
    expect(screen.getByText("Não foi possível carregar a ficha.")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "VOLTAR PARA FICHAS" })
        .getAttribute("href"),
    ).toBe("/fichas");
  });

  it("limpa a sessão e redireciona para autenticação quando a consulta recebe 401", async () => {
    localStorage.setItem("wilderfeast_user", "usuario");
    vi.mocked(getFeral).mockRejectedValue(new ApiError("Sessão expirada", 401));
    render(<Sheet />);

    await waitFor(() =>
      expect(screen.queryByLabelText("Carregando ficha")).toBeNull(),
    );
    expect(navigation.router.replace).toHaveBeenCalledExactlyOnceWith(
      "/login?next=/fichas/7",
    );
    expect(localStorage.getItem("wilderfeast_user")).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Ficha indisponível" }),
    ).toBeNull();
  });

  it.each(["sucesso", "erro"])(
    "ignora o %s da consulta após navegar para outra ficha",
    async (outcome) => {
      let settle!: () => void;
      vi.mocked(getFeral).mockReturnValueOnce(
        new Promise((resolve, reject) => {
          settle =
            outcome === "sucesso"
              ? () => resolve(feral)
              : () => reject(new Error("Falha na primeira consulta"));
        }),
      );
      const nextFeral = { ...feral, id: 8, nome: "Naila" };
      vi.mocked(getFeral).mockResolvedValueOnce(nextFeral);
      const view = render(<Sheet />);

      navigation.id = "8";
      view.rerender(<Sheet />);
      expect(
        await screen.findByRole("heading", { name: "Naila" }),
      ).toBeTruthy();
      await act(async () => settle());

      expect(screen.getByRole("heading", { name: "Naila" })).toBeTruthy();
      expect(
        screen.queryByText("Não foi possível carregar a ficha."),
      ).toBeNull();
    },
  );

  it.each([7, 8])(
    "só exclui com confirmação e limpa a seleção se a ficha ativa é %s",
    async (ativa) => {
      salvarFeralAtivo({ id: ativa, nome: "Askell", imagem_url: null });
      vi.mocked(getFeral).mockResolvedValue(feral);
      let finish!: (data: { ok: true }) => void;
      vi.mocked(deleteFeral).mockReturnValue(
        new Promise((resolve) => {
          finish = resolve;
        }),
      );
      const confirm = vi
        .spyOn(window, "confirm")
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);
      render(<Sheet />);
      const button = await screen.findByRole("button", {
        name: "EXCLUIR FICHA",
      });

      fireEvent.click(button);
      expect(deleteFeral).not.toHaveBeenCalled();
      fireEvent.click(button);

      expect(confirm).toHaveBeenLastCalledWith(
        "Excluir definitivamente a ficha de Askell?",
      );
      expect(deleteFeral).toHaveBeenCalledExactlyOnceWith(7);
      expect(
        screen
          .getByRole("button", { name: "EXCLUINDO..." })
          .hasAttribute("disabled"),
      ).toBe(true);

      await act(async () => finish({ ok: true }));
      expect(feralAtivoId()).toBe(ativa === 7 ? 0 : 8);
      expect(navigation.router.replace).toHaveBeenCalledExactlyOnceWith(
        "/fichas",
      );
      expect(navigation.router.refresh).toHaveBeenCalledTimes(1);
    },
  );

  it("preserva a ficha e reabilita o botão se a exclusão falhar", async () => {
    vi.mocked(getFeral).mockResolvedValue(feral);
    vi.mocked(deleteFeral).mockRejectedValue(new Error("Falha de rede"));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<Sheet />);
    fireEvent.click(
      await screen.findByRole("button", { name: "EXCLUIR FICHA" }),
    );

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Não foi possível excluir a ficha.",
    );
    expect(screen.getByRole("heading", { name: "Askell" })).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "EXCLUIR FICHA" })
        .hasAttribute("disabled"),
    ).toBe(false);
    expect(navigation.router.replace).not.toHaveBeenCalled();
  });
});
