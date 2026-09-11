import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { Field } from "../Field/Field";
import { Textarea } from "./Textarea";

test("herda id/aria do Field, marca inválido e nasce com 3 linhas", () => {
  const ref = createRef<HTMLTextAreaElement>();
  render(
    <Field label="Observações" error="Muito longo">
      <Textarea ref={ref} />
    </Field>,
  );
  const campo = screen.getByLabelText("Observações");
  expect(campo).toBe(ref.current);
  expect(campo).toHaveAttribute("rows", "3");
  expect(campo).toHaveAttribute("aria-invalid", "true");
  expect(campo.getAttribute("aria-describedby")).toBe(screen.getByRole("alert").id);
});

test("fora do Field aceita rows próprio e invalid explícito", () => {
  render(<Textarea aria-label="Motivo" rows={5} invalid />);
  const campo = screen.getByLabelText("Motivo");
  expect(campo).toHaveAttribute("rows", "5");
  expect(campo).toHaveAttribute("aria-invalid", "true");
});
