import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { FinancialFields } from "./FinancialFields";
import { type ReservaForm, reservaVazia } from "./tipos";

function Harness({ inicial }: { inicial?: Partial<ReservaForm> }) {
  const [v, setV] = useState<ReservaForm>({ ...reservaVazia(0), ...inicial });
  return (
    <>
      <FinancialFields
        value={v}
        onChange={(patch) => {
          setV((prev) => ({ ...prev, ...patch }));
        }}
        percentualSugerido={10}
        erros={{}}
      />
      <output data-testid="comissao">{String(v.valorComissao)}</output>
    </>
  );
}

const seloCobrado = () =>
  within(screen.getByLabelText("Total cobrado do cliente").parentElement!).queryByText("calculado");

test("mostra 'Sugerido: 10 %' quando comissaoSugerida", () => {
  render(<Harness />);
  expect(screen.getByText("Sugerido: 10 %")).toBeInTheDocument();
});

test("digitar em Comissão emite comissaoSugerida: false e some o selo", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const input = screen.getByLabelText("Comissão (R$)");
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
  await user.click(document.body);
  expect(screen.getByLabelText("Total cobrado do cliente")).toHaveValue("R$ 3.000,00");
  expect(seloCobrado()).toBeInTheDocument();
});

test("A03 (review 1): editar o Total de novo enquanto a Venda ainda está sugerida ressincroniza", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const total = screen.getByLabelText("Total da reserva");
  await user.click(total);
  await user.type(total, "3000");
  await user.click(document.body);
  expect(screen.getByLabelText("Total cobrado do cliente")).toHaveValue("R$ 3.000,00");

  await user.click(total);
  await user.clear(total);
  await user.type(total, "5000");
  await user.click(document.body);

  expect(screen.getByLabelText("Total cobrado do cliente")).toHaveValue("R$ 5.000,00");
  expect(seloCobrado()).toBeInTheDocument();
});

test("A03: se a Venda já foi digitada, sair do Total não sobrescreve", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const venda = screen.getByLabelText("Total cobrado do cliente");
  await user.click(venda);
  await user.type(venda, "5000");
  await user.click(document.body);

  const total = screen.getByLabelText("Total da reserva");
  await user.click(total);
  await user.type(total, "3000");
  await user.click(document.body);

  expect(venda).toHaveValue("R$ 5.000,00");
  expect(seloCobrado()).not.toBeInTheDocument();
});

test("A03: digitar na Venda depois de sugerida some o selo 'calculado'", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const total = screen.getByLabelText("Total da reserva");
  await user.click(total);
  await user.type(total, "3000");
  await user.click(document.body);
  expect(seloCobrado()).toBeInTheDocument();

  const venda = screen.getByLabelText("Total cobrado do cliente");
  await user.click(venda);
  await user.type(venda, "9");
  expect(seloCobrado()).not.toBeInTheDocument();
});

test("A03 teclado: Tab do Total para o Total cobrado já mostra o sugerido e sair dele não apaga", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const total = screen.getByLabelText("Total da reserva");
  await user.click(total);
  await user.type(total, "3000");
  await user.tab();
  const cobrado = screen.getByLabelText("Total cobrado do cliente");
  expect(cobrado).toHaveFocus();
  expect(cobrado).toHaveValue("3000,00");
  await user.tab();
  expect(cobrado).toHaveValue("R$ 3.000,00");
  expect(seloCobrado()).toBeInTheDocument();
});

test("chip 'Dinheiro' existe e alterna formasPagamento ao clicar", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const chip = screen.getByRole("button", { name: "Dinheiro" });
  expect(chip).toHaveAttribute("aria-pressed", "false");
  await user.click(chip);
  expect(chip).toHaveAttribute("aria-pressed", "true");
});

test("Comissão (%), RAV e Taxa de serviço têm tooltip explicando o cálculo com exemplo", () => {
  render(<Harness />);
  const tooltips = screen.getAllByTitle(/ex\.:/i);
  const rotulos = tooltips.map((el) => el.closest("label")?.textContent);
  expect(rotulos).toEqual(
    expect.arrayContaining([
      expect.stringContaining("Comissão (%)"),
      expect.stringContaining("RAV"),
      expect.stringContaining("Taxa de serviço"),
    ]),
  );
  expect(tooltips).toHaveLength(3);
});

test("comissão em % e R$ lado a lado: digitar % calcula R$", async () => {
  const user = userEvent.setup();
  render(<Harness inicial={{ valorTotal: 10000 }} />);
  await user.type(screen.getByLabelText("Comissão (%)"), "10");
  expect(screen.getByTestId("comissao")).toHaveTextContent("1000");
  expect(screen.getByLabelText("Comissão (R$)")).toHaveValue("R$ 1.000,00");
});

test("digitar % com centésimos: 6,5 % de 1.234,56 = 80,25", async () => {
  const user = userEvent.setup();
  render(<Harness inicial={{ valorTotal: 1234.56 }} />);
  await user.type(screen.getByLabelText("Comissão (%)"), "6,5");
  expect(screen.getByTestId("comissao")).toHaveTextContent("80.25");
});

test("digitar R$ mostra o % derivado", async () => {
  const user = userEvent.setup();
  render(
    <Harness
      inicial={{
        valorTotal: 10000,
        valorComissao: 1250,
        comissaoSugerida: false,
      }}
    />,
  );
  expect(screen.getByLabelText("Comissão (%)")).toHaveValue("12,5");
  const reais = screen.getByLabelText("Comissão (R$)");
  await user.clear(reais);
  await user.type(reais, "800");
  expect(screen.getByLabelText("Comissão (%)")).toHaveValue("8");
});

test("sem total, o % fica vazio", () => {
  render(<Harness inicial={{ valorTotal: 0, valorComissao: 50, comissaoSugerida: false }} />);
  expect(screen.getByLabelText("Comissão (%)")).toHaveValue("");
});

test("com % como âncora, mudar o total recalcula a comissão", async () => {
  const user = userEvent.setup();
  render(<Harness inicial={{ valorTotal: 10000 }} />);
  await user.type(screen.getByLabelText("Comissão (%)"), "10");
  const total = screen.getByLabelText("Total da reserva");
  await user.click(total);
  await user.clear(total);
  await user.type(total, "20000");
  await user.tab();
  expect(screen.getByTestId("comissao")).toHaveTextContent("2000");
});

test("digitar R$ solta a âncora: mudar o total não recalcula a comissão", async () => {
  const user = userEvent.setup();
  render(<Harness inicial={{ valorTotal: 10000 }} />);
  await user.type(screen.getByLabelText("Comissão (%)"), "10");
  const reais = screen.getByLabelText("Comissão (R$)");
  await user.clear(reais);
  await user.type(reais, "700");
  const total = screen.getByLabelText("Total da reserva");
  await user.click(total);
  await user.clear(total);
  await user.type(total, "20000");
  await user.tab();
  expect(screen.getByTestId("comissao")).toHaveTextContent("700");
});

test("% negativo ou acima de 100 mostra erro e não altera a comissão", async () => {
  const user = userEvent.setup();
  render(<Harness inicial={{ valorTotal: 2000 }} />);
  const pct = screen.getByLabelText("Comissão (%)");
  await user.type(pct, "10");
  expect(screen.getByTestId("comissao")).toHaveTextContent("200");
  await user.type(pct, "1");
  expect(screen.getByRole("alert")).toHaveTextContent("entre 0 e 100");
  expect(screen.getByTestId("comissao")).toHaveTextContent("200");
  await user.clear(pct);
  await user.type(pct, "-");
  expect(screen.getByRole("alert")).toHaveTextContent("entre 0 e 100");
});

test("RAV e Total da comissão são calculados e não editáveis", () => {
  render(
    <Harness
      inicial={{
        valorTotal: 10000,
        valorCliente: 10500,
        valorComissao: 1000,
        comissaoSugerida: false,
      }}
    />,
  );
  expect(screen.getByLabelText("RAV")).toHaveAttribute("readonly");
  expect(screen.getByLabelText("RAV")).toHaveValue("R$ 500,00");
  expect(screen.getByLabelText("Total da comissão")).toHaveAttribute("readonly");
  expect(screen.getByLabelText("Total da comissão")).toHaveValue("R$ 1.500,00");
});

test("sem Fluxo, sem RAV da operadora, sem modo do RAV", () => {
  render(<Harness />);
  expect(screen.queryByLabelText(/Fluxo/)).toBeNull();
  expect(screen.queryByLabelText(/RAV da operadora/)).toBeNull();
  expect(screen.queryByLabelText(/RAV do cliente vem/)).toBeNull();
});

test("Taxa de serviço visível fora de '+ mais campos', com explicação", () => {
  render(<Harness />);
  const campo = screen.getByLabelText("Taxa de serviço");
  expect(campo.closest("details")).toBeNull();
  expect(screen.getByText("Cobrada do cliente por fora da reserva; soma direto na receita da agência.")).toBeVisible();
});
