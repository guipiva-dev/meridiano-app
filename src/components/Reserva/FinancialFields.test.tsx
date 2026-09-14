import { render, screen } from "@testing-library/react";
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

test("A03 (review 1): editar o Total de novo enquanto a Venda ainda está sugerida ressincroniza", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const total = screen.getByLabelText("Total da reserva");
  await user.click(total);
  await user.type(total, "3000");
  await user.tab();
  expect(screen.getByLabelText("Venda ao cliente")).toHaveValue("R$ 3.000,00");

  await user.click(total);
  await user.clear(total);
  await user.type(total, "5000");
  await user.tab();

  expect(screen.getByLabelText("Venda ao cliente")).toHaveValue("R$ 5.000,00");
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

test("chip 'Dinheiro' existe e alterna formasPagamento ao clicar", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const chip = screen.getByRole("button", { name: "Dinheiro" });
  expect(chip).toHaveAttribute("aria-pressed", "false");
  await user.click(chip);
  expect(chip).toHaveAttribute("aria-pressed", "true");
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

describe("L1: comissão em R$ ou %", () => {
  const botaoPct = () => screen.getByRole("button", { name: "Comissão em %" });
  const botaoReais = () => screen.getByRole("button", { name: "Comissão em R$" });

  test("abre em R$; Tab a partir da Comissão chega na alternância", async () => {
    const user = userEvent.setup();
    render(<Harness inicial={{ valorTotal: 2000, valorComissao: 300, comissaoSugerida: false }} />);
    expect(botaoReais()).toHaveAttribute("aria-pressed", "true");
    expect(botaoPct()).toHaveAttribute("aria-pressed", "false");
    await user.click(screen.getByLabelText("Comissão"));
    await user.tab();
    expect(botaoReais()).toHaveFocus();
    await user.tab();
    expect(botaoPct()).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(botaoPct()).toHaveAttribute("aria-pressed", "true");
  });

  test("modo %: 6 % de 2.000 = R$ 120,00 no formulário e como texto calculado", async () => {
    const user = userEvent.setup();
    render(<Harness inicial={{ valorTotal: 2000 }} />);
    await user.click(botaoPct());
    const pct = screen.getByLabelText("Comissão");
    await user.clear(pct);
    await user.type(pct, "6");
    expect(screen.getByTestId("comissao")).toHaveTextContent("120");
    expect(screen.getByText("= R$ 120,00")).toBeInTheDocument();
  });

  test("modo %: 6,5 % de 1.234,56 = 80,25", async () => {
    const user = userEvent.setup();
    render(<Harness inicial={{ valorTotal: 1234.56 }} />);
    await user.click(botaoPct());
    const pct = screen.getByLabelText("Comissão");
    await user.clear(pct);
    await user.type(pct, "6,5");
    expect(screen.getByTestId("comissao")).toHaveTextContent("80.25");
  });

  test("modo %: mudar o total recalcula a comissão", async () => {
    const user = userEvent.setup();
    render(<Harness inicial={{ valorTotal: 2000 }} />);
    await user.click(botaoPct());
    const pct = screen.getByLabelText("Comissão");
    await user.clear(pct);
    await user.type(pct, "6");
    const total = screen.getByLabelText("Total da reserva");
    await user.click(total);
    await user.clear(total);
    await user.type(total, "3000");
    await user.tab();
    expect(screen.getByTestId("comissao")).toHaveTextContent("180");
    expect(screen.getByText("= R$ 180,00")).toBeInTheDocument();
  });

  test("R$→% preenche o % do valor atual; %→R$ mantém o valor calculado", async () => {
    const user = userEvent.setup();
    render(<Harness inicial={{ valorTotal: 2000, valorComissao: 130, comissaoSugerida: false }} />);
    await user.click(botaoPct());
    expect(screen.getByLabelText("Comissão")).toHaveValue("6,5");
    await user.clear(screen.getByLabelText("Comissão"));
    await user.type(screen.getByLabelText("Comissão"), "7");
    await user.click(botaoReais());
    expect(screen.getByLabelText("Comissão")).toHaveValue("R$ 140,00");
    expect(screen.getByTestId("comissao")).toHaveTextContent("140");
  });

  test("R$→% com total 0 deixa o % vazio", async () => {
    const user = userEvent.setup();
    render(<Harness inicial={{ valorTotal: 0, valorComissao: 50, comissaoSugerida: false }} />);
    await user.click(botaoPct());
    expect(screen.getByLabelText("Comissão")).toHaveValue("");
  });

  test("% negativo ou acima de 100 mostra erro e não altera a comissão", async () => {
    const user = userEvent.setup();
    render(<Harness inicial={{ valorTotal: 2000 }} />);
    await user.click(botaoPct());
    const pct = screen.getByLabelText("Comissão");
    await user.clear(pct);
    await user.type(pct, "10");
    expect(screen.getByTestId("comissao")).toHaveTextContent("200");
    await user.type(pct, "1");
    expect(screen.getByRole("alert")).toHaveTextContent("entre 0 e 100");
    expect(screen.getByTestId("comissao")).toHaveTextContent("200");
    await user.clear(pct);
    await user.type(pct, "-");
    expect(screen.getByRole("alert")).toHaveTextContent("entre 0 e 100");
  });
});
