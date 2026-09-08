import { render, screen } from "@testing-library/react";
import { Input } from "../Input/Input";
import { Field } from "./Field";

test("liga label, helper e erro ao controle", () => {
  render(
    <Field label="E-mail" required helper="Use o e-mail do convite" error="E-mail inválido">
      <Input />
    </Field>,
  );
  const input = screen.getByLabelText(/E-mail/);
  expect(input).toHaveAttribute("aria-invalid", "true");
  const ids = input.getAttribute("aria-describedby")!.split(" ");
  expect(ids).toHaveLength(1);
  expect(screen.getByText("E-mail inválido")).toHaveAttribute("role", "alert");
});
