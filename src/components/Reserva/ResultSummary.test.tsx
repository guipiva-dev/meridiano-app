import { render, screen, within } from "@testing-library/react";
import { ResultSummary } from "./ResultSummary";
import { reservaVazia } from "./tipos";

test("mostra a conta: cobrado − reserva = RAV; + comissão = total; + taxa = receita", () => {
  render(
    <ResultSummary
      value={{
        ...reservaVazia(0),
        valorTotal: 10000,
        valorCliente: 10500,
        valorComissao: 1000,
        taxaServico: 150,
      }}
    />,
  );
  const linha = (rotulo: string) => screen.getByText(rotulo).closest("div")!;
  expect(within(linha("Total cobrado do cliente")).getByText("R$ 10.500,00")).toBeInTheDocument();
  expect(within(linha("Total da reserva")).getByText("R$ 10.000,00")).toBeInTheDocument();
  expect(within(linha("RAV")).getByText("R$ 500,00")).toBeInTheDocument();
  expect(within(linha("Comissão (10 %)")).getByText("R$ 1.000,00")).toBeInTheDocument();
  expect(within(linha("Total da comissão")).getByText("R$ 1.500,00")).toBeInTheDocument();
  expect(within(linha("Taxa de serviço")).getByText("R$ 150,00")).toBeInTheDocument();
  expect(within(linha("Receita da agência")).getByText("R$ 1.650,00")).toBeInTheDocument();
  expect(screen.queryByText("RAV da operadora")).toBeNull();
});

test("RAV da operadora legado aparece só quando > 0", () => {
  render(
    <ResultSummary
      value={{
        ...reservaVazia(0),
        valorTotal: 10000,
        valorCliente: 10000,
        valorComissao: 1000,
        ravOperadora: 100,
      }}
    />,
  );
  expect(screen.getByText("RAV da operadora")).toBeInTheDocument();
});
