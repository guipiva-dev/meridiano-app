import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { Radio } from "./Radio";

test("renderiza rótulo e encaminha ref", () => {
  const ref = createRef<HTMLInputElement>();
  render(<Radio ref={ref} label="Cartão de crédito" name="pagamento" />);
  const radio = screen.getByLabelText("Cartão de crédito");
  expect(radio).toBe(ref.current);
  expect(radio).toHaveAttribute("type", "radio");
});
