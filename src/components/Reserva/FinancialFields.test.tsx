import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { FinancialFields } from "./FinancialFields";
import { type ReservaForm, reservaVazia } from "./tipos";

function Harness() {
  const [v, setV] = useState<ReservaForm>(reservaVazia(0));
  return (
    <FinancialFields
      value={v}
      onChange={(patch) => {
        setV((prev) => ({ ...prev, ...patch }));
      }}
      percentualSugerido={10}
      erros={{}}
    />
  );
}

test("mostra 'Sugerido: 10 %' quando comissaoSugerida", () => {
  render(<Harness />);
  expect(screen.getByText("Sugerido: 10 %")).toBeInTheDocument();
});

test("digitar em Comissão emite comissaoSugerida: false e some o selo", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const input = screen.getByLabelText("Comissão");
  await user.click(input);
  await user.type(input, "300");
  expect(screen.queryByText("Sugerido: 10 %")).not.toBeInTheDocument();
});

test("Observações da reserva tem maxLength 2000", () => {
  render(<Harness />);
  expect(screen.getByLabelText("Observações")).toHaveAttribute("maxLength", "2000");
});

test("A03: sair do Total com Venda vazia pré-preenche Venda = Total (marcada como sugerida)", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const total = screen.getByLabelText("Total da reserva");
  await user.click(total);
  await user.type(total, "3000");
  await user.tab();
  expect(screen.getByLabelText("Venda ao cliente")).toHaveValue("R$ 3.000,00");
  expect(screen.getByText("calculado")).toBeInTheDocument();
});

test("A03: se a Venda já foi digitada, sair do Total não sobrescreve", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const venda = screen.getByLabelText("Venda ao cliente");
  await user.click(venda);
  await user.type(venda, "5000");
  await user.tab();

  const total = screen.getByLabelText("Total da reserva");
  await user.click(total);
  await user.type(total, "3000");
  await user.tab();

  expect(venda).toHaveValue("R$ 5.000,00");
  expect(screen.queryByText("calculado")).not.toBeInTheDocument();
});

test("A03: digitar na Venda depois de sugerida some o selo 'calculado'", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const total = screen.getByLabelText("Total da reserva");
  await user.click(total);
  await user.type(total, "3000");
  await user.tab();
  expect(screen.getByText("calculado")).toBeInTheDocument();

  const venda = screen.getByLabelText("Venda ao cliente");
  await user.click(venda);
  await user.type(venda, "9");
  expect(screen.queryByText("calculado")).not.toBeInTheDocument();
});

test("Comissão, Taxa de serviço e Fluxo têm tooltip explicando o cálculo com exemplo", () => {
  render(<Harness />);
  const tooltips = screen.getAllByTitle(/ex\.:/i);
  const rotulos = tooltips.map((el) => el.closest("label")?.textContent);
  expect(rotulos).toEqual(
    expect.arrayContaining([
      expect.stringContaining("Comissão"),
      expect.stringContaining("Taxa de serviço"),
      expect.stringContaining("Fluxo"),
    ]),
  );
  expect(tooltips).toHaveLength(3);
});
