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

test("o bloco Reservas conta só as ativas", () => {
  render(
    <ResumoTab
      viagem={{ ...VIAGEM, reservas: [RESERVA_1, { ...RESERVA_2, status: "cancelada" }] }}
      verValores={true}
      pendencias={[]}
      onAbrirReserva={noop}
      onVerPendencias={noop}
    />,
  );
  expect(screen.getByText(/^1 · clique para abrir/)).toBeInTheDocument();
});
