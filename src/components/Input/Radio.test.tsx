import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { Field } from "../Field/Field";
import { Radio } from "./Radio";

test("renderiza rótulo e encaminha ref", () => {
  const ref = createRef<HTMLInputElement>();
  render(<Radio ref={ref} label="Cartão de crédito" name="pagamento" />);
  const radio = screen.getByLabelText("Cartão de crédito");
  expect(radio).toBe(ref.current);
  expect(radio).toHaveAttribute("type", "radio");
});

test("dois radios no mesmo Field têm ids distintos", () => {
  render(
    <Field label="Pagamento">
      <Radio label="Cartão de crédito" name="pagamento" value="cartao" />
      <Radio label="Boleto" name="pagamento" value="boleto" />
    </Field>,
  );
  const cartao = screen.getByLabelText("Cartão de crédito");
  const boleto = screen.getByLabelText("Boleto");
  expect(cartao.id).not.toBe(boleto.id);
});
