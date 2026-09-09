import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ValidationError } from "@/api/errors";
import { PessoaInlineModal } from "./PessoaInlineModal";

test("submit sem nome mostra erro de campo", async () => {
  const user = userEvent.setup();
  const criar = vi.fn();
  render(<PessoaInlineModal open onClose={vi.fn()} onCriada={vi.fn()} criar={criar} />);

  await user.click(screen.getByRole("button", { name: "Criar" }));

  expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();
  expect(criar).not.toHaveBeenCalled();
});

test("erro 422 cpf_invalido mostra erro no campo CPF", async () => {
  const user = userEvent.setup();
  const criar = vi.fn().mockRejectedValue(new ValidationError(422, "cpf_invalido", "CPF inválido"));
  render(<PessoaInlineModal open onClose={vi.fn()} onCriada={vi.fn()} criar={criar} />);

  await user.type(screen.getByLabelText(/Nome/), "Carlos Mendes");
  await user.click(screen.getByRole("button", { name: "Criar" }));

  expect(await screen.findByText("CPF inválido")).toBeInTheDocument();
});
