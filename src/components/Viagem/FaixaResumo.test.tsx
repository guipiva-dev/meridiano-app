import { render, screen } from "@testing-library/react";
import { FaixaResumo, type ItemFaixa } from "./FaixaResumo";

test("mostra os itens e o extra, com destaque e tooltip", () => {
  const itens: ItemFaixa[] = [
    { label: "Venda total", value: 13700 },
    { label: "Custo dos fornecedores", value: 13000 },
    { label: "Comissão da vendedora", value: 300 },
    { label: "Despesas da viagem", value: 0 },
    {
      label: "Resultado da viagem",
      value: 1640,
      destaque: true,
      tooltip: "Receita das reservas − comissão da vendedora − despesas vinculadas",
    },
  ];
  render(<FaixaResumo itens={itens} extra={{ label: "Comissões recebidas", value: 500 }} />);

  expect(screen.getByText("Venda total")).toBeInTheDocument();
  expect(screen.getByText("Comissões recebidas")).toBeInTheDocument();
  expect(screen.getByText("R$ 13.700,00")).toBeInTheDocument();
  expect(screen.getByText("R$ 500,00")).toBeInTheDocument();

  const resultado = screen.getByText("R$ 1.640,00");
  expect(resultado).toHaveClass("result");

  expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent(
    "Receita das reservas − comissão da vendedora − despesas vinculadas",
  );
});
