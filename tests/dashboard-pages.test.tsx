/** Exercita o layout, a mesa de dados e a busca no inventário. */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { StrictMode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import Dados from "@/app/dados/page";
import RootLayout, { metadata } from "@/app/layout";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

it("define o idioma da página, os metadados e o conteúdo do layout raiz", () => {
  const markup = renderToStaticMarkup(
    <RootLayout>
      <main>Mesa de caça</main>
    </RootLayout>,
  );
  const page = new DOMParser().parseFromString(markup, "text/html");

  expect(page.documentElement.lang).toBe("pt-BR");
  expect(page.body.querySelector("main")?.textContent).toBe("Mesa de caça");
  expect(metadata).toEqual({
    title: "Wilderfeast",
    description: "Aventure-se, cace e festeje.",
  });
});

it("rola cada tipo de dado, mantém as seis rolagens mais recentes e permite limpar o histórico", () => {
  vi.spyOn(Date, "now").mockReturnValue(100);
  const reactErrors = vi.spyOn(console, "error");
  const random = vi.spyOn(Math, "random").mockReturnValue(0.99);
  const { container } = render(
    <StrictMode>
      <Dados />
    </StrictMode>,
  );
  const [human, animal] = screen.getAllByRole("button", { name: "ROLAR DADO" });
  const style = screen.getByRole("button", { name: "ROLAR ESTILO" });
  const quantity = screen.getByRole<HTMLSelectElement>("combobox", {
    name: "Quantidade",
  });
  const history = screen
    .getByRole("heading", { name: "Últimas rolagens" })
    .closest("section")!;

  expect(quantity.value).toBe("3");
  expect(within(quantity).getByRole("option", { name: "1 dado" })).toBeTruthy();
  expect(
    within(quantity).getByRole("option", { name: "5 dados" }),
  ).toBeTruthy();
  expect(
    within(history).getByText(
      "Role um dado para começar o histórico desta sessão.",
    ),
  ).toBeTruthy();
  expect(within(history).queryByRole("button", { name: "LIMPAR" })).toBeNull();

  fireEvent.click(human);
  fireEvent.click(animal);
  expect(
    [...container.querySelectorAll(".faceted-die")].map(
      (die) => die.textContent,
    ),
  ).toEqual(["8", "20"]);
  fireEvent.change(quantity, { target: { value: "2" } });
  expect(
    [...container.querySelectorAll(".style-die")].map((die) => die.textContent),
  ).toEqual(["1", "1"]);
  fireEvent.click(style);
  expect(
    [...container.querySelectorAll(".style-die")].map((die) => die.textContent),
  ).toEqual(["6", "6"]);
  const [styleRoll, animalRoll, humanRoll] =
    within(history).getAllByRole("listitem");
  expect(within(styleRoll).getByText("Dados de Estilo · d6")).toBeTruthy();
  expect(within(styleRoll).getByText("6 + 6")).toBeTruthy();
  expect(within(animalRoll).getByText("Dado Animal · d20")).toBeTruthy();
  expect(within(animalRoll).getByText("20")).toBeTruthy();
  expect(within(humanRoll).getByText("Dado Humano · d8")).toBeTruthy();
  expect(within(humanRoll).getByText("8")).toBeTruthy();

  random.mockReturnValue(0);
  for (let count = 0; count < 4; count++) fireEvent.click(animal);
  const recent = within(history).getAllByRole("listitem");
  expect(recent).toHaveLength(6);
  expect(reactErrors).not.toHaveBeenCalled();
  expect(within(recent[0]).getByText("1")).toBeTruthy();
  expect(within(history).queryByText("Dado Humano · d8")).toBeNull();

  fireEvent.click(within(history).getByRole("button", { name: "LIMPAR" }));
  expect(within(history).queryByRole("list")).toBeNull();
  expect(
    within(history).getByText(
      "Role um dado para começar o histórico desta sessão.",
    ),
  ).toBeTruthy();
});
