import { render, screen } from "@testing-library/react";
import { Field } from "../Field/Field";
import { Checkbox } from "./Checkbox";

test("dentro de Field, o htmlFor do label bate com o id do input", () => {
  render(
    <Field label="Aceito os termos">
      <Checkbox label="Sim, aceito" />
    </Field>,
  );
  const checkbox = screen.getByRole("checkbox");
  const fieldLabel = screen.getByText("Aceito os termos");
  expect(fieldLabel.tagName).toBe("LABEL");
  expect(fieldLabel).toHaveAttribute("for", checkbox.id);
});
