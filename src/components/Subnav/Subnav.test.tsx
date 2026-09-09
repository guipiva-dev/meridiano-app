import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Subnav } from "./Subnav";

const ITEMS = [
  { label: "Viagens", path: "/viagens" },
  { label: "Nova viagem", path: "/viagens/nova" },
];

function montar(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <Subnav items={ITEMS} />
    </MemoryRouter>,
  );
}

test("na lista, Viagens fica ativo", () => {
  montar("/viagens");
  expect(screen.getByRole("link", { name: "Viagens" }).className).toMatch(/ativo/);
  expect(screen.getByRole("link", { name: "Nova viagem" }).className).not.toMatch(/ativo/);
});

test("em /viagens/nova, Nova viagem fica ativo (não Viagens)", () => {
  montar("/viagens/nova");
  expect(screen.getByRole("link", { name: "Nova viagem" }).className).toMatch(/ativo/);
  expect(screen.getByRole("link", { name: "Viagens" }).className).not.toMatch(/ativo/);
});

test("em /viagens/:id, Viagens fica ativo (não Nova viagem)", () => {
  montar("/viagens/abc123");
  expect(screen.getByRole("link", { name: "Viagens" }).className).toMatch(/ativo/);
  expect(screen.getByRole("link", { name: "Nova viagem" }).className).not.toMatch(/ativo/);
});
