import { render, screen } from "@testing-library/react";
import { type ReservaValores, TripSummary } from "./TripSummary";

test("soma vendas e calcula o resultado da viagem", () => {
  const reservas: ReservaValores[] = [
    {
      valorTotal: 3000,
      valorComissao: 300,
      ravOperadora: 20,
      valorCliente: 3200,
      taxaServico: 0,
      ravClienteModo: "via_operadora",
    },
    {
      valorTotal: 10000,
      valorComissao: 1000,
      ravOperadora: 100,
      valorCliente: 10500,
      taxaServico: 0,
      ravClienteModo: "via_operadora",
    },
  ];
  render(<TripSummary reservas={reservas} repasseValor={300} despesas={0} onAdicionarReserva={vi.fn()} />);

  expect(screen.getByText("R$ 13.700,00")).toBeInTheDocument();
  expect(screen.getByText("R$ 13.000,00")).toBeInTheDocument();
  expect(screen.getByText("R$ 1.820,00")).toBeInTheDocument();
});

test("sem mostrarResultado esconde comissão, despesas e resultado, e mostra a receita", () => {
  const reservas: ReservaValores[] = [
    {
      valorTotal: 3000,
      valorComissao: 300,
      ravOperadora: 20,
      valorCliente: 3200,
      taxaServico: 0,
      ravClienteModo: "via_operadora",
    },
  ];
  render(
    <TripSummary
      reservas={reservas}
      repasseValor={300}
      despesas={0}
      onAdicionarReserva={vi.fn()}
      mostrarResultado={false}
    />,
  );

  expect(screen.queryByText("Comissão da vendedora")).toBeNull();
  expect(screen.queryByText("Despesas da viagem")).toBeNull();
  expect(screen.queryByText(/Resultado da viagem/)).toBeNull();
  expect(screen.getByText("Receita das reservas")).toBeInTheDocument();
  expect(screen.getByText("R$ 520,00")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "+ Adicionar reserva" })).toBeInTheDocument();
});

test("reserva cancelada fica fora de todos os totais (alinhado ao Resumo do detalhe)", () => {
  const ativa: ReservaValores = {
    valorTotal: 3000,
    valorComissao: 300,
    ravOperadora: 20,
    valorCliente: 3200,
    taxaServico: 0,
    ravClienteModo: "via_operadora",
    status: "emitida",
  };
  const cancelada: ReservaValores = { ...ativa, valorTotal: 10000, valorCliente: 10500, status: "cancelada" };
  render(<TripSummary reservas={[ativa, cancelada]} repasseValor={0} despesas={0} onAdicionarReserva={vi.fn()} />);

  expect(screen.getByText("R$ 3.200,00")).toBeInTheDocument();
  expect(screen.getByText("R$ 3.000,00")).toBeInTheDocument();
  expect(screen.queryByText("R$ 13.700,00")).toBeNull();
  expect(screen.getByText("R$ 520,00")).toBeInTheDocument();
});
