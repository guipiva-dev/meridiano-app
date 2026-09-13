import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { RESERVA_1, RESERVA_2, VIAGEM } from "./fixtures";
import { ResumoTab } from "./ResumoTab";

const noop = vi.fn();

test("sem resumo, com verValores, mostra a faixa reduzida (Receita da agência, sem Resultado da viagem)", () => {
  render(
    <ResumoTab
      viagem={{ ...VIAGEM, resumo: undefined }}
      verValores={true}
      pendencias={[]}
      onAbrirReserva={noop}
      onVerPendencias={noop}
    />,
  );
  expect(screen.getByText("Receita da agência")).toBeInTheDocument();
  expect(screen.queryByText("Resultado da viagem")).toBeNull();
});

test("o bloco Reservas conta só as ativas no título, mas mostra Ativas N · Total M quando há cancelada", () => {
  render(
    <ResumoTab
      viagem={{ ...VIAGEM, reservas: [RESERVA_1, { ...RESERVA_2, status: "cancelada" }] }}
      verValores={true}
      pendencias={[]}
      onAbrirReserva={noop}
      onVerPendencias={noop}
    />,
  );
  expect(screen.getByText(/^Ativas 1 · Total 2 · clique para abrir/)).toBeInTheDocument();
});

test("sem cancelada, o bloco Reservas mostra só a contagem", () => {
  render(
    <ResumoTab
      viagem={{ ...VIAGEM, reservas: [RESERVA_1, RESERVA_2] }}
      verValores={true}
      pendencias={[]}
      onAbrirReserva={noop}
      onVerPendencias={noop}
    />,
  );
  expect(screen.getByText(/^2 · clique para abrir/)).toBeInTheDocument();
});

test("faixa completa: Receita recebida e Comissão do vendedor", () => {
  render(<ResumoTab viagem={VIAGEM} verValores={true} pendencias={[]} onAbrirReserva={noop} onVerPendencias={noop} />);
  expect(screen.getByText("Receita recebida")).toBeInTheDocument();
  expect(screen.getByText("Comissão do vendedor")).toBeInTheDocument();
  expect(screen.getByText(/Soma de todos os movimentos/)).toHaveAttribute("role", "tooltip");
  expect(screen.queryByText(/Comissões recebidas|vendedora/)).toBeNull();
});

test("U06: faixa completa mostra Receita prevista entre Custo dos fornecedores e Comissão do vendedor", () => {
  render(<ResumoTab viagem={VIAGEM} verValores={true} pendencias={[]} onAbrirReserva={noop} onVerPendencias={noop} />);
  const rotulos = screen.getAllByText(/^(Venda total|Custo dos fornecedores|Receita prevista|Comissão do vendedor)$/);
  expect(rotulos.map((el) => el.textContent)).toEqual([
    "Venda total",
    "Custo dos fornecedores",
    "Receita prevista",
    "Comissão do vendedor",
  ]);
  expect(screen.getByText("Receita prevista").parentElement).toHaveTextContent("R$ 2.000,00");
});

test("U06: sem verValores (nem resumo), Receita prevista some junto com o resto da faixa", () => {
  render(
    <ResumoTab
      viagem={{ ...VIAGEM, resumo: undefined }}
      verValores={false}
      pendencias={[]}
      onAbrirReserva={noop}
      onVerPendencias={noop}
    />,
  );
  expect(screen.queryByText("Receita prevista")).toBeNull();
});

test("P02: vendedor externo (sem resumo, sem verValores) vê 'Seu repasse' com valor e status", () => {
  render(
    <ResumoTab
      viagem={{ ...VIAGEM, resumo: undefined, repasse: { id: "rp1", valor: 300, status: "bloqueado" } }}
      verValores={false}
      pendencias={[]}
      onAbrirReserva={noop}
      onVerPendencias={noop}
    />,
  );
  expect(screen.getByText("Seu repasse")).toBeInTheDocument();
  expect(screen.getByText("R$ 300,00")).toBeInTheDocument();
  expect(screen.getByText("Bloqueado")).toBeInTheDocument();
});
