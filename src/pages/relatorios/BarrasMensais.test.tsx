import { render, screen } from "@testing-library/react";
import type { ReceitaMesDto } from "@/api/relatorios";
import { formatarDinheiro } from "@/lib/dinheiro";
import { BarrasMensais } from "./BarrasMensais";

function meses(over: Partial<Record<number, Partial<ReceitaMesDto>>> = {}): ReceitaMesDto[] {
  return Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    prevista: 10,
    recebida: 5,
    ...over[i + 1],
  }));
}

test("renderiza 12 grupos, um por mês, com aria-label prevista/recebida", () => {
  render(<BarrasMensais meses={meses()} />);
  expect(screen.getAllByRole("group")).toHaveLength(12);
  expect(
    screen.getByRole("group", { name: `jan: prevista ${formatarDinheiro(10)}, recebida ${formatarDinheiro(5)}` }),
  ).toBeInTheDocument();
});

test("o maior valor do conjunto vira 100% de altura", () => {
  render(<BarrasMensais meses={meses({ 3: { recebida: 120 } })} />);
  const grupoMar = screen.getByRole("group", { name: /^mar:/ });
  expect(grupoMar.querySelector('[data-barra="recebida"]')).toHaveStyle({ "--altura": "100" });
});

test("valor negativo (estorno) mostra altura 0 com title do valor real", () => {
  render(<BarrasMensais meses={meses({ 1: { recebida: -50 } })} />);
  const grupoJan = screen.getByRole("group", { name: /^jan:/ });
  const barra = grupoJan.querySelector('[data-barra="recebida"]');
  expect(barra).toHaveStyle({ "--altura": "0" });
  expect(barra).toHaveAttribute("title", formatarDinheiro(-50));
});
