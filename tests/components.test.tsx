/** Verifica navegação, sessão local e renderização dos componentes compartilhados. */
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
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CharacterCard from "@/components/CharacterCard";
import DashboardShell from "@/components/DashboardShell";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MonsterCard from "@/components/MonsterCard";
import SidebarIdentity from "@/components/SidebarIdentity";
import { API_URL } from "@/lib/api-origin";
import { salvarFeralAtivo } from "@/lib/feral-ativo";
import { deferred } from "./deferred";

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));

beforeEach(() => {
  router.replace.mockReset();
  router.refresh.mockReset();
});

describe("DashboardShell", () => {
  it("reusa a identidade do cookie ao navegar e consulta a API quando ele vence", async () => {
    const agora = Date.now();
    const relogio = vi.spyOn(Date, "now").mockReturnValue(agora);
    localStorage.setItem(
      "wilderfeast_user",
      JSON.stringify({ id: 3, nome: "Lia" }),
    );
    const primeira = "https://example.test/lia.png";
    const nova = "https://example.test/lia-atualizada.png";
    const cookieAntigo = encodeURIComponent(
      JSON.stringify({
        conta: "3",
        nome: "Lia",
        imagem: primeira,
        expiraEm: agora + 60_000,
      }),
    );
    document.cookie = `wilderfeast_sidebar_identity=${cookieAntigo}; Path=/`;
    const renovacao = deferred<Response>();
    const rede = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json([{ id: 7, nome: "Lua", imagem_url: primeira }]),
      )
      .mockReturnValueOnce(renovacao.promise);
    vi.stubGlobal("fetch", rede);

    const inicio = render(
      <StrictMode>
        <DashboardShell active="inicio">Início</DashboardShell>
      </StrictMode>,
    );
    const foto = () =>
      screen
        .getByRole("link", { name: "Alterar imagem do Feral ativo" })
        .querySelector("img")
        ?.getAttribute("src");
    expect(foto()).toBe(primeira);
    expect(await screen.findByText("Lua")).toBeTruthy();
    expect(screen.getByText("@Lia")).toBeTruthy();
    expect(document.cookie).toContain("wilderfeast_sidebar_identity=");
    expect(rede).toHaveBeenCalledTimes(1);

    inicio.unmount();
    const dados = render(<DashboardShell active="dados">Dados</DashboardShell>);
    expect(foto()).toBe(primeira);
    fireEvent(window, new Event("focus"));
    expect(rede).toHaveBeenCalledTimes(1);

    relogio.mockReturnValue(agora + 24 * 60 * 60 * 1000 + 1);
    fireEvent(window, new Event("focus"));
    expect(foto()).toBe(primeira);
    dados.unmount();
    render(<DashboardShell active="utensilios">Utensílios</DashboardShell>);
    expect(foto()).toBe(primeira);
    expect(screen.getByText("Lua")).toBeTruthy();
    await act(async () => {
      renovacao.resolve(
        Response.json([{ id: 7, nome: "Lua", imagem_url: nova }]),
      );
    });
    await waitFor(() => expect(foto()).toBe(nova));
    expect(rede).toHaveBeenCalledTimes(2);
  });

  it("acompanha a imagem salva do Feral ativo e usa um marcador quando a foto falha ou a conta muda", () => {
    const usuario = JSON.stringify({ nome: "Lia" });
    localStorage.setItem("wilderfeast_user", usuario);
    salvarFeralAtivo({
      id: 7,
      nome: "Lua",
      imagem_url: "/static/uploads/lua.png",
    });
    expect(renderToString(<SidebarIdentity />)).not.toContain("lua.png");
    render(<DashboardShell active="inicio">Início</DashboardShell>);
    const avatar = screen.getByRole("link", {
      name: "Alterar imagem do Feral ativo",
    });
    expect(avatar.getAttribute("href")).toBe("/perfil");
    expect(avatar.querySelector("img")?.getAttribute("src")).toBe(
      `${API_URL.replace(/\/$/, "")}/static/uploads/lua.png`,
    );
    fireEvent.error(avatar.querySelector("img")!);
    expect(avatar.querySelector("img")).toBeNull();
    act(() =>
      salvarFeralAtivo({
        id: 8,
        nome: "Sol",
        imagem_url: "https://example.test/novo.png",
      }),
    );
    expect(avatar.querySelector("img")?.getAttribute("src")).toBe(
      "https://example.test/novo.png",
    );
    expect(screen.getByText("Sol")).toBeTruthy();
    expect(screen.getByText("@Lia")).toBeTruthy();
    act(() => {
      localStorage.setItem(
        "wilderfeast_user",
        JSON.stringify({ nome: "Outra conta" }),
      );
      window.dispatchEvent(new Event("storage"));
    });
    expect(avatar.querySelector("img")).toBeNull();
  });

  it("grava a preferência uma única vez por clique no modo estrito", () => {
    const savePreference = vi.spyOn(Storage.prototype, "setItem");
    render(
      <StrictMode>
        <DashboardShell active="inicio">Início</DashboardShell>
      </StrictMode>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Minimizar menu" }));

    expect(savePreference).toHaveBeenCalledExactlyOnceWith(
      "wilderfeast_sidebar_collapsed",
      "true",
    );
  });

  it("exibe a navegação, destaca a página ativa e persiste a preferência do menu", () => {
    const { rerender, unmount } = render(
      <DashboardShell
        active="dados"
        contentClassName="dice-content"
        dashboardClassName="dice-dashboard"
      >
        <h1>Mesa de caça</h1>
      </DashboardShell>,
    );

    expect(screen.getByText("FERAL")).toBeTruthy();
    expect(screen.getByRole("main").className).toBe(
      "home-content dice-content",
    );
    expect(screen.getByRole("complementary").parentElement?.className).toBe(
      "home-dashboard dice-dashboard",
    );
    expect(screen.getByRole("heading", { name: "Mesa de caça" })).toBeTruthy();

    const navigation = screen.getByRole("navigation", {
      name: "Navegação principal",
    });
    expect(
      within(navigation)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual(["/", "/fichas", "/utensilios", "/bestiario", "/dados"]);
    expect(
      within(navigation)
        .getByRole("link", { name: "Rolagem de Dados" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(
      screen.getByRole("link", { name: "Perfil" }).hasAttribute("aria-current"),
    ).toBe(false);

    const minimize = screen.getByRole("button", { name: "Minimizar menu" });
    expect(minimize.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(minimize);
    expect(
      screen
        .getByRole("button", { name: "Expandir menu" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
    expect(localStorage.getItem("wilderfeast_sidebar_collapsed")).toBe("true");
    expect(
      screen
        .getByRole("complementary")
        .parentElement?.classList.contains("sidebar-collapsed"),
    ).toBe(true);
    expect(
      screen
        .getByRole("complementary")
        .parentElement?.classList.contains("sidebar-motion"),
    ).toBe(true);

    rerender(<DashboardShell active="perfil">Perfil do Feral</DashboardShell>);
    expect(
      screen.getByRole("link", { name: "Perfil" }).getAttribute("aria-current"),
    ).toBe("page");
    expect(
      within(navigation)
        .getByRole("link", { name: "Rolagem de Dados" })
        .hasAttribute("aria-current"),
    ).toBe(false);
    expect(screen.getByRole("main").className).toBe("home-content");

    unmount();
    render(<DashboardShell active="inicio">Início</DashboardShell>);
    const novoPainel = screen.getByRole("complementary").parentElement;
    expect(novoPainel?.classList.contains("sidebar-collapsed")).toBe(true);
    expect(novoPainel?.classList.contains("sidebar-motion")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Expandir menu" }));
    expect(screen.getByRole("button", { name: "Minimizar menu" })).toBeTruthy();
    expect(localStorage.getItem("wilderfeast_sidebar_collapsed")).toBe("false");
  });

  it.each([
    ['{"nome":"  Ágata  ","email":"outro@example.test"}', "@Ágata"],
    ['{"nome":" ","email":"vítor@example.test"}', "@vítor"],
    ['{"email":"caçador@example.test"}', "@caçador"],
    ["{}", "FERAL"],
  ])("exibe o nome esperado para a sessão local %s", (savedUser, name) => {
    localStorage.setItem("wilderfeast_user", savedUser);
    render(<DashboardShell active="inicio">Início</DashboardShell>);

    expect(screen.getByText(name)).toBeTruthy();
    expect(localStorage.getItem("wilderfeast_user")).toBe(savedUser);
  });

  it("remove um registro de sessão malformado e mostra o nome padrão", () => {
    localStorage.setItem("wilderfeast_user", "{inválido");
    render(<DashboardShell active="inicio">Início</DashboardShell>);

    expect(screen.getByText("FERAL")).toBeTruthy();
    expect(localStorage.getItem("wilderfeast_user")).toBeNull();
  });
});

it.each([
  ["cabeçalho", <Header />],
  ["menu lateral", <DashboardShell active="inicio">Início</DashboardShell>],
])("encerra a sessão pelo %s", async (_location, component) => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ ok: true }));
  vi.stubGlobal("fetch", request);
  localStorage.setItem("wilderfeast_user", '{"nome":"Ágata"}');
  render(component);

  fireEvent.click(screen.getByRole("button", { name: "Sair" }));

  expect(request).toHaveBeenCalledExactlyOnceWith("/api/session", {
    method: "DELETE",
  });
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledExactlyOnceWith("/login"),
  );
  expect(router.refresh).toHaveBeenCalledOnce();
  expect(localStorage.getItem("wilderfeast_user")).toBeNull();
});

it("oferece links para o início, as fichas e o bestiário no cabeçalho", () => {
  render(<Header />);

  expect(
    screen.getByRole("link", { name: /Wilderfeast/ }).getAttribute("href"),
  ).toBe("/");
  expect(
    screen.getByRole("link", { name: "Fichas" }).getAttribute("href"),
  ).toBe("/fichas");
  expect(
    screen.getByRole("link", { name: "Bestiário" }).getAttribute("href"),
  ).toBe("/bestiario");
});

it("exibe a marca e os créditos no rodapé", () => {
  render(<Footer />);

  const footer = screen.getByRole("contentinfo");
  expect(within(footer).getByText("WILDERFEAST")).toBeTruthy();
  expect(within(footer).getByText("© 2026 Wilderfeast")).toBeTruthy();
});

it("renderiza a ficha padrão e aceita nome e imagem personalizados", () => {
  const { rerender } = render(<CharacterCard />);

  expect(
    screen.getByRole("img", { name: "Gata Samurai" }).getAttribute("src"),
  ).toBe(imagensCloudinary.utensilios.cutelo);
  expect(
    screen.getByRole("link", { name: "Ficha Completa" }).getAttribute("href"),
  ).toBe("/fichas/personagem");

  rerender(<CharacterCard name="Ágata" image="/agata.png" />);
  expect(screen.getByRole("img", { name: "Ágata" }).getAttribute("src")).toBe(
    "/agata.png",
  );
  expect(screen.getByText("Ágata")).toBeTruthy();
});

it("associa cada cartão à sua besta e ajusta o texto pelo índice", () => {
  const { rerender } = render(<MonsterCard />);

  expect(
    screen.getByRole("link", { name: /Besta 1/ }).getAttribute("href"),
  ).toBe("/bestiario/1");
  expect(screen.getByRole("img", { name: "Hagsechu" })).toBeTruthy();
  expect(screen.getByText("Faz isso e aquilo")).toBeTruthy();

  rerender(<MonsterCard index={7} />);
  expect(
    screen.getByRole("link", { name: /Besta 8/ }).getAttribute("href"),
  ).toBe("/bestiario/8");
  expect(screen.getByRole("img", { name: "Mammudo" })).toBeTruthy();
  expect(screen.getByText("É muito difícil de caçar")).toBeTruthy();
});
