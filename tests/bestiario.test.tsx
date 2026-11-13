/**
 * Exercita a busca e a listagem do bestiário e o carregamento de fichas de fera.
 * @module
 */

import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BeastSheet from "@/app/bestiario/[id]/page";
import Bestiario from "@/app/bestiario/page";
import type { Monstro } from "@/lib/api";
import { deferred } from "./deferred";

/** Permite trocar o identificador da fera sem montar o roteador do Next.js. */
const navigation = vi.hoisted(() => ({ id: "7", router: {} }));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: navigation.id }),
  useRouter: () => navigation.router,
}));

/** Controla o transporte para simular respostas e atrasos da API. */
const fetchMock = vi.fn<typeof fetch>();

/** Fera de referência com um campo opcional ausente. */
const monster: Monstro = {
  id: 7,
  nome: "Carpa da Serra",
  categoria: "Adulto",
  vigor_base: 10,
  vigor_atual: 6,
  historia: "Nascida no rio da serra.",
  alvos: null,
  dieta: "Frutas",
  habitat: "Águas rasas",
};

beforeEach(() => {
  navigation.id = "7";
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("lista do bestiário", () => {
  it("mostra os registros, filtra por característica e exibe os campos ausentes", async () => {
    const pending = deferred<Response>();
    fetchMock.mockReturnValueOnce(pending.promise);
    const { container } = render(<Bestiario />);

    expect(screen.getByText("— REGISTROS")).toBeTruthy();
    expect(container.querySelectorAll(".bestiary-skeleton")).toHaveLength(6);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/session?resource=monstros",
      expect.anything(),
    );

    await act(async () => {
      pending.resolve(
        Response.json([
          { ...monster, vigor_atual: 15 },
          {
            ...monster,
            id: 8,
            nome: "Coruja da Mata",
            categoria: "Jovem",
            habitat: null,
            dieta: null,
            vigor_atual: -2,
          },
        ]),
      );
    });

    expect(screen.getByText("02 REGISTROS")).toBeTruthy();
    const carp = screen.getByRole("link", { name: /Carpa da Serra/ });
    const owl = screen.getByRole("link", { name: /Coruja da Mata/ });
    expect(carp.getAttribute("href")).toBe("/bestiario/7");
    expect(within(carp).getByText("REGISTRO #007")).toBeTruthy();
    expect(within(carp).getByText("VIGOR 15 / 10")).toBeTruthy();
    expect(carp.querySelector("i")?.style.width).toBe("100%");
    expect(within(owl).getByText("Habitat desconhecido")).toBeTruthy();
    expect(within(owl).getByText("Dieta desconhecida")).toBeTruthy();
    expect(owl.querySelector("i")?.style.width).toBe("0%");

    const search = screen.getByRole("searchbox", {
      name: "Buscar no bestiário",
    });
    fireEvent.change(search, { target: { value: "  ÁGUAS  " } });
    expect(screen.getByRole("heading", { name: monster.nome })).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Coruja da Mata" }),
    ).toBeNull();
    fireEvent.change(search, { target: { value: "brasa" } });
    expect(
      screen.getByRole("heading", { name: "Nenhuma fera encontrada" }),
    ).toBeTruthy();
    fireEvent.change(search, { target: { value: "" } });
    expect(
      screen.getByRole("heading", { name: "Coruja da Mata" }),
    ).toBeTruthy();
  });

  it("mostra que o bestiário está vazio quando a API retorna uma lista vazia", async () => {
    fetchMock.mockResolvedValueOnce(Response.json([]));
    render(<Bestiario />);

    expect(
      await screen.findByRole("heading", { name: "Bestiário vazio" }),
    ).toBeTruthy();
    expect(screen.getByText("00 REGISTROS")).toBeTruthy();
  });

  it("mostra uma mensagem de erro quando a consulta falha", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Sem conexão"));
    render(<Bestiario />);

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Não foi possível carregar o bestiário.",
    );
    expect(
      screen.queryByRole("heading", { name: "Bestiário vazio" }),
    ).toBeNull();
  });

  it.each([true, false])(
    "ignora a consulta encerrada na remontagem (falha: %s)",
    async (reject) => {
      const previous = deferred<Response>();
      const current = deferred<Response>();
      fetchMock
        .mockReturnValueOnce(previous.promise)
        .mockReturnValueOnce(current.promise);
      render(
        <StrictMode>
          <Bestiario />
        </StrictMode>,
      );

      await act(async () => {
        if (reject) previous.reject(new TypeError("Consulta encerrada"));
        else
          previous.resolve(
            Response.json([{ ...monster, nome: "Registro anterior" }]),
          );
      });
      expect(screen.getByText("— REGISTROS")).toBeTruthy();
      expect(screen.queryByRole("alert")).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Registro anterior" }),
      ).toBeNull();

      await act(async () => current.resolve(Response.json([monster])));
      expect(screen.getByRole("heading", { name: monster.nome })).toBeTruthy();
    },
  );
});

describe("ficha de uma fera", () => {
  it("carrega o registro e mostra os dados disponíveis", async () => {
    const pending = deferred<Response>();
    fetchMock.mockReturnValueOnce(pending.promise);
    const { container } = render(<BeastSheet />);

    expect(screen.getByLabelText("Carregando monstro")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/session?resource=monstro&id=7",
      expect.anything(),
    );
    await act(async () => pending.resolve(Response.json(monster)));

    expect(screen.getByRole("heading", { name: monster.nome })).toBeTruthy();
    expect(screen.getByText("REGISTRO DE FERA · #007")).toBeTruthy();
    expect(screen.getByText("6 / 10")).toBeTruthy();
    expect(
      container.querySelector<HTMLElement>(".beast-api-vigor i")?.style.width,
    ).toBe("60%");
    expect(screen.getByText(monster.historia!)).toBeTruthy();
    expect(screen.getByText("Não informado pela API.")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /VOLTAR AO BESTIÁRIO/ })
        .getAttribute("href"),
    ).toBe("/bestiario");
  });

  it.each(["abc", "0"])(
    "rejeita o identificador %s sem consultar a API",
    (id) => {
      navigation.id = id;
      render(<BeastSheet />);

      expect(
        screen.getByRole("heading", { name: "Registro indisponível" }),
      ).toBeTruthy();
      expect(
        screen.getByText("O identificador desse monstro é inválido."),
      ).toBeTruthy();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("mostra o erro informado pela API e oferece retorno à lista", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ error: "Fera não encontrada" }, { status: 404 }),
    );
    render(<BeastSheet />);

    expect(
      await screen.findByRole("heading", { name: "Registro indisponível" }),
    ).toBeTruthy();
    expect(screen.getByText("Fera não encontrada")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "VOLTAR AO BESTIÁRIO" })
        .getAttribute("href"),
    ).toBe("/bestiario");
  });

  it("mantém o cabeçalho quando a API responde sem um registro", async () => {
    const pending = deferred<Response>();
    fetchMock.mockReturnValueOnce(pending.promise);
    render(<BeastSheet />);

    await act(async () => pending.resolve(new Response(null, { status: 204 })));

    expect(screen.getByText("WILDERFEAST · BESTIÁRIO")).toBeTruthy();
    expect(screen.queryByLabelText("Carregando monstro")).toBeNull();
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it.each([true, false])(
    "ignora a consulta anterior ao trocar de ficha (falha: %s)",
    async (reject) => {
      const previous = deferred<Response>();
      const current = deferred<Response>();
      fetchMock
        .mockReturnValueOnce(previous.promise)
        .mockReturnValueOnce(current.promise);
      const { rerender } = render(<BeastSheet />);

      navigation.id = "8";
      rerender(<BeastSheet />);
      await act(async () => {
        if (reject) previous.reject(new TypeError("Consulta encerrada"));
        else previous.resolve(Response.json(monster));
      });
      expect(screen.getByLabelText("Carregando monstro")).toBeTruthy();
      expect(screen.queryByRole("heading")).toBeNull();

      await act(async () =>
        current.resolve(
          Response.json({ ...monster, id: 8, nome: "Coruja da Mata" }),
        ),
      );
      expect(
        screen.getByRole("heading", { name: "Coruja da Mata" }),
      ).toBeTruthy();
      expect(screen.queryByRole("heading", { name: monster.nome })).toBeNull();
    },
  );
});
