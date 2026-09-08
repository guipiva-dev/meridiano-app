import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { MoneyInput } from "./MoneyInput";

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
  await user.click(input);
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
  await user.click(input);
  await user.clear(input);
  await user.tab();
  expect(input).toHaveValue("");
  expect(screen.getByRole("status")).toHaveTextContent("null");
});

test("aceita negativo quando allowNegative", async () => {
  const user = userEvent.setup();
  render(<Harness allowNegative />);
  const input = screen.getByLabelText("Valor");
  await user.click(input);
  await user.type(input, "-50");
  await user.tab();
  expect(input).toHaveValue("−R$ 50,00");
  expect(screen.getByRole("status")).toHaveTextContent("-50");
});

test("aceita colar valor formatado com sinal U+2212", async () => {
  const user = userEvent.setup();
  render(<Harness allowNegative />);
  const input = screen.getByLabelText("Valor");
  await user.click(input);
  await user.paste("−R$ 10,00");
  await user.tab();
  expect(input).toHaveValue("−R$ 10,00");
  expect(screen.getByRole("status")).toHaveTextContent("-10");
});
