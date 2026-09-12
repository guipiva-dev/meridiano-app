import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { MoneyInput } from "./MoneyInput";

/**
 * focar() agenda o select() num requestAnimationFrame. Sem esperar o frame, a digitação seguinte
 * corria antes ou depois da seleção conforme o timing do rAF do jsdom (flake). Espera o frame.
 */
async function clicar(user: ReturnType<typeof userEvent.setup>, el: HTMLElement) {
  await user.click(el);
  await act(
    () =>
      new Promise<void>((r) =>
        requestAnimationFrame(() => {
          r();
        }),
      ),
  );
}

function Harness({ inicial = null as number | null, allowNegative = false }) {
  const [v, setV] = useState<number | null>(inicial);
  return (
    <>
      <MoneyInput aria-label="Valor" value={v} onChange={setV} allowNegative={allowNegative} />
      <output>{String(v)}</output>
    </>
  );
}

test("mostra formatado, edita cru, devolve número", async () => {
  const user = userEvent.setup();
  render(<Harness inicial={1234.5} />);
  const input = screen.getByLabelText("Valor");
  expect(input).toHaveValue("R$ 1.234,50");
  await clicar(user, input);
  expect(input).toHaveValue("1234,50");
  await user.clear(input);
  await user.type(input, "99,9");
  await user.tab();
  expect(input).toHaveValue("R$ 99,90");
  expect(screen.getByRole("status")).toHaveTextContent("99.9");
});

test("vazio devolve null", async () => {
  const user = userEvent.setup();
  render(<Harness inicial={10} />);
  const input = screen.getByLabelText("Valor");
  await clicar(user, input);
  await user.clear(input);
  await user.tab();
  expect(input).toHaveValue("");
  expect(screen.getByRole("status")).toHaveTextContent("null");
});

test("aceita negativo quando allowNegative", async () => {
  const user = userEvent.setup();
  render(<Harness allowNegative />);
  const input = screen.getByLabelText("Valor");
  await clicar(user, input);
  await user.type(input, "-50");
  await user.tab();
  expect(input).toHaveValue("−R$ 50,00");
  expect(screen.getByRole("status")).toHaveTextContent("-50");
});

test("emite onChange a cada tecla, sem esperar o blur", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const input = screen.getByLabelText("Valor");
  await clicar(user, input);
  await user.type(input, "1500");
  expect(screen.getByRole("status")).toHaveTextContent("1500");
});

test("sem allowNegative, o caractere '-' é recusado (não clampa silenciosamente) e mostra erro", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const input = screen.getByLabelText("Valor");
  await clicar(user, input);
  await user.type(input, "-");
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByRole("alert")).toHaveTextContent("Valor não pode ser negativo");
  await user.type(input, "50");
  expect(screen.getByRole("status")).toHaveTextContent("50");
});

test("clique com o mouse seleciona o texto todo: digitar 300 substitui, não concatena", async () => {
  const user = userEvent.setup();
  render(<Harness inicial={0} />);
  const input = screen.getByLabelText("Valor");
  expect(input).toHaveValue("R$ 0,00");
  await clicar(user, input);
  await user.keyboard("300");
  await user.tab();
  expect(input).toHaveValue("R$ 300,00");
  expect(screen.getByRole("status")).toHaveTextContent("300");
});

test("foco por Tab depois clique dentro do campo não suprime o reposicionamento do cursor", async () => {
  const user = userEvent.setup();
  render(<Harness inicial={10} />);
  const input = screen.getByLabelText("Valor");
  await user.tab();
  expect(input).toHaveFocus();
  const evento = new MouseEvent("mouseup", { bubbles: true, cancelable: true });
  input.dispatchEvent(evento);
  expect(evento.defaultPrevented).toBe(false);
});

test("clique que causa o foco ainda suprime o reposicionamento (select-all vence)", () => {
  render(<Harness inicial={10} />);
  const input = screen.getByLabelText("Valor");
  input.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
  input.focus();
  const evento = new MouseEvent("mouseup", { bubbles: true, cancelable: true });
  input.dispatchEvent(evento);
  expect(evento.defaultPrevented).toBe(true);
});

test("texto ambíguo (resto de digitação truncada tipo 0,00300) não vira 3.000 nem some: mantém valor anterior e marca erro", async () => {
  const user = userEvent.setup();
  render(<Harness inicial={12} />);
  const input = screen.getByLabelText("Valor");
  await clicar(user, input);
  await user.clear(input);
  await user.type(input, "0,00300");
  expect(input).toHaveValue("0,003");
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByRole("alert")).toHaveTextContent("Valor inválido");
  await user.tab();
  expect(input).toHaveValue("R$ 0,00");
});

test("mais de 10 dígitos inteiros bloqueia a digitação", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const input = screen.getByLabelText("Valor");
  await clicar(user, input);
  await user.type(input, "12345678901");
  expect(input).toHaveValue("1234567890");
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByRole("alert")).toHaveTextContent("Valor acima do limite de R$ 9.999.999.999,99");
});

test("aceita colar valor formatado com sinal U+2212", async () => {
  const user = userEvent.setup();
  render(<Harness allowNegative />);
  const input = screen.getByLabelText("Valor");
  await clicar(user, input);
  await user.paste("−R$ 10,00");
  await user.tab();
  expect(input).toHaveValue("−R$ 10,00");
  expect(screen.getByRole("status")).toHaveTextContent("-10");
});
