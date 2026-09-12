import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { EsqueciSenhaPage } from "./EsqueciSenhaPage";

// Homologação: submit vazio mostrava "Campos obrigatórios ausentes" (genérico da API).
test("e-mail vazio: erro no campo, sem chamar a API", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  render(
    <MemoryRouter>
      <EsqueciSenhaPage />
    </MemoryRouter>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Enviar link de redefinição" }));
  expect(screen.getByLabelText(/E-mail/)).toHaveAccessibleDescription("Informe o e-mail");
  expect(fetchSpy).not.toHaveBeenCalled();
});
