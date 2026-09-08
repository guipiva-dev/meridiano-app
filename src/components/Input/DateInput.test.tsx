import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { DateInput } from "./DateInput";

test("renderiza input nativo type=date e encaminha ref", () => {
  const ref = createRef<HTMLInputElement>();
  render(<DateInput ref={ref} aria-label="Data de nascimento" />);
  const input = screen.getByLabelText("Data de nascimento");
  expect(input).toBe(ref.current);
  expect(input).toHaveAttribute("type", "date");
});
