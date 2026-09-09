import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SenhaForm } from "./SenhaForm";

test("valida 8 caracteres, diferente do e-mail e confirmação", async () => {
  const onSubmit = vi.fn();
  render(<SenhaForm email="ana@x.com" submitLabel="Definir senha e entrar" onSubmit={onSubmit} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/Nova senha/), "ana@x.com");
  await user.type(screen.getByLabelText(/Confirmar senha/), "outra");
  await user.click(screen.getByRole("button", { name: "Definir senha e entrar" }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
});
