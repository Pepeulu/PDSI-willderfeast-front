import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Cadastro from "@/app/cadastro/page";
import Login from "@/app/login/page";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/assets_organizados_wilderfeast/05_ilustracoes_cenas/145.jpg", () => ({
  default: { src: "/auth-background.jpg" },
}));

const fetchSession = vi.fn<typeof fetch>();
const email = "caçador@example.test";
const senha = "senha-de-teste";

function fillCredentials(identity = email, password = senha) {
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: identity } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: password } });
}

function submitLogin() {
  fireEvent.click(screen.getByRole("button", { name: "ENTRAR" }));
}

function submitSignup() {
  fireEvent.click(screen.getByRole("button", { name: "CADASTRAR" }));
}

function expectRequest(call: number, action: string, payload: Record<string, string>) {
  expect(fetchSession).toHaveBeenNthCalledWith(call, "/api/session", expect.objectContaining({
    body: JSON.stringify({ action, payload }),
    method: "POST",
  }));
}

beforeEach(() => {
  router.push.mockReset();
  router.refresh.mockReset();
  fetchSession.mockReset();
  vi.stubGlobal("fetch", fetchSession);
  window.history.replaceState(null, "", "/login");
});

describe("Login", () => {
  it("valida credenciais ausentes ou com e-mail inválido antes de chamar a API", () => {
    render(<Login />);

    submitLogin();
    expect(screen.getByRole("alert").textContent).toBe("Credenciais incompletas.");

    fillCredentials(email, "");
    submitLogin();
    expect(screen.getByRole("alert").textContent).toBe("Credenciais incompletas.");

    fillCredentials("sem-dominio", senha);
    submitLogin();
    expect(screen.getByRole("alert").textContent).toBe("Digite um endereço de e-mail válido.");
    expect(fetchSession).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "CADASTRAR NOVO FERAL" }).getAttribute("href")).toBe("/cadastro");
  });

  it("carrega a identidade lembrada, salva a sessão e segue o destino interno", async () => {
    localStorage.setItem("wilderfeast_identity", "ANTIGO@EXAMPLE.TEST");
    window.history.replaceState(null, "", "/login?next=%2Ffichas%3Faba%3Dativas");
    let completeLogin!: (response: Response) => void;
    fetchSession.mockReturnValue(new Promise((resolve) => { completeLogin = resolve; }));

    render(<Login />);
    expect(screen.getByLabelText<HTMLInputElement>("E-mail").value).toBe("ANTIGO@EXAMPLE.TEST");
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Lembrar de mim" }).checked).toBe(true);

    fillCredentials("  CAÇADOR@EXAMPLE.TEST  ");
    submitLogin();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "AGUARDE..." }).disabled).toBe(true);
    expectRequest(1, "login", { email, senha });

    completeLogin(Response.json({ usuario_id: 17 }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/fichas?aba=ativas"));
    expect(router.refresh).toHaveBeenCalledOnce();
    expect(JSON.parse(localStorage.getItem("wilderfeast_user")!)).toEqual({ email, id: 17, nome: "caçador" });
    expect(localStorage.getItem("wilderfeast_identity")).toBe(email);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "ENTRAR" }).disabled).toBe(false);
  });

  it.each(["//example.test/fora", "https://example.test/fora"])(
    "abre a página inicial quando next é %s e apaga a identidade desmarcada",
    async (destination) => {
      localStorage.setItem("wilderfeast_identity", email);
      window.history.replaceState(null, "", `/login?next=${encodeURIComponent(destination)}`);
      fetchSession.mockResolvedValue(Response.json({ usuario_id: 2 }));

      render(<Login />);
      fireEvent.click(screen.getByRole("checkbox", { name: "Lembrar de mim" }));
      fillCredentials();
      submitLogin();

      await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
      expect(localStorage.getItem("wilderfeast_identity")).toBeNull();
    },
  );

  it("exibe a mensagem da API e reabilita o formulário após a falha", async () => {
    fetchSession.mockResolvedValue(Response.json({ error: "Senha incorreta" }, { status: 401 }));
    render(<Login />);
    fillCredentials();
    submitLogin();

    expect((await screen.findByRole("alert")).textContent).toBe("Senha incorreta");
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "ENTRAR" }).disabled).toBe(false);
    expect(router.push).not.toHaveBeenCalled();
    expect(localStorage.getItem("wilderfeast_user")).toBeNull();
  });
});

describe("Cadastro", () => {
  it("pede um nome além das credenciais e começa com o formulário vazio", () => {
    localStorage.setItem("wilderfeast_identity", email);
    render(<Cadastro />);

    expect(screen.getByLabelText<HTMLInputElement>("E-mail").value).toBe("");
    expect(screen.getByRole("link", { name: "ENTRAR" }).getAttribute("href")).toBe("/login");
    fillCredentials();
    fireEvent.change(screen.getByLabelText("Nome de usuário"), { target: { value: "   " } });
    submitSignup();

    expect(screen.getByRole("alert").textContent).toBe("Dados de cadastro incompletos.");
    expect(fetchSession).not.toHaveBeenCalled();
  });

  it("cadastra, autentica e usa o nome informado quando ele falta na resposta", async () => {
    fetchSession
      .mockResolvedValueOnce(Response.json({ id: 1, email, nome: null }))
      .mockResolvedValueOnce(Response.json({ usuario_id: 23 }));
    render(<Cadastro />);
    fireEvent.change(screen.getByLabelText("Nome de usuário"), { target: { value: "  Ágata  " } });
    fillCredentials();
    submitSignup();

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
    expectRequest(1, "register", { email, nome: "Ágata", senha });
    expectRequest(2, "login", { email, senha });
    expect(JSON.parse(localStorage.getItem("wilderfeast_user")!)).toEqual({ email, id: 23, nome: "Ágata" });
  });

  it("mostra a mensagem de cadastro quando a rede falha", async () => {
    fetchSession.mockRejectedValue(new TypeError("offline"));
    render(<Cadastro />);
    fireEvent.change(screen.getByLabelText("Nome de usuário"), { target: { value: "Ágata" } });
    fillCredentials();
    submitSignup();

    expect((await screen.findByRole("alert")).textContent).toBe("Não foi possível concluir o cadastro.");
    expect(fetchSession).toHaveBeenCalledOnce();
    expect(router.push).not.toHaveBeenCalled();
  });
});
