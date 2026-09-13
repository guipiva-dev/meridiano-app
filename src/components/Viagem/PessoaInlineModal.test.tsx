import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConflictError, ValidationError } from "@/api/errors";
import { PessoaInlineModal } from "./PessoaInlineModal";

async function preencherObrigatorios(user: ReturnType<typeof userEvent.setup>, nome = "Carlos Mendes") {
  await user.type(screen.getByLabelText(/Nome/), nome);
  await user.type(screen.getByLabelText(/^CPF/), "52998224725");
  fireEvent.change(screen.getByLabelText(/^Nascimento/), { target: { value: "1980-05-05" } });
}

test("submit sem nome, CPF e nascimento mostra erro em cada campo e não chama a API", async () => {
  const user = userEvent.setup();
  const criar = vi.fn();
  render(<PessoaInlineModal open onClose={vi.fn()} onCriada={vi.fn()} criar={criar} />);

  await user.click(screen.getByRole("button", { name: "Criar" }));

  expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();
  expect(screen.getByText("Informe o CPF")).toBeInTheDocument();
  expect(screen.getByText("Informe a data de nascimento")).toBeInTheDocument();
  expect(criar).not.toHaveBeenCalled();
});

test("campo Nascimento existe e é obrigatório", () => {
  render(<PessoaInlineModal open onClose={vi.fn()} onCriada={vi.fn()} criar={vi.fn()} />);
  const nascimento = screen.getByLabelText(/^Nascimento/);
  expect(nascimento).toBeRequired();
  expect(nascimento).toHaveAttribute("type", "date");
});

test("erro 422 cpf_invalido mostra erro no campo CPF", async () => {
  const user = userEvent.setup();
  const criar = vi.fn().mockRejectedValue(new ValidationError(422, "cpf_invalido", "CPF inválido"));
  render(<PessoaInlineModal open onClose={vi.fn()} onCriada={vi.fn()} criar={criar} />);

  await preencherObrigatorios(user);
  await user.click(screen.getByRole("button", { name: "Criar" }));

  expect(await screen.findByText("CPF inválido")).toBeInTheDocument();
});

test("Enter no campo Nome envia o formulário", async () => {
  const user = userEvent.setup();
  const cliente = { id: "1", nome: "Carlos Mendes", telefone: null };
  const criar = vi.fn().mockResolvedValue(cliente);
  const onCriada = vi.fn();
  render(<PessoaInlineModal open onClose={vi.fn()} onCriada={onCriada} criar={criar} />);

  await preencherObrigatorios(user);
  const nomeInput = screen.getByLabelText(/Nome/);
  const form = nomeInput.closest("form");
  if (!form) throw new Error("campo Nome fora do <form>");
  fireEvent.submit(form);

  await waitFor(() => {
    expect(criar).toHaveBeenCalledWith({
      nome: "Carlos Mendes",
      cpf: "52998224725",
      dataNascimento: "1980-05-05",
    });
  });
  expect(onCriada).toHaveBeenCalledWith(cliente);
});

test("abre com foco no campo Nome", () => {
  render(<PessoaInlineModal open onClose={vi.fn()} onCriada={vi.fn()} criar={vi.fn()} />);
  expect(screen.getByLabelText(/Nome/)).toHaveFocus();
});

test.each([
  ["email_invalido", "E-mail inválido", /E-mail/],
  ["telefone_invalido", "Telefone precisa ter 10 ou 11 dígitos", /Telefone/],
  ["cpf_duplicado", "Já existe uma pessoa com esse CPF", /CPF/],
])("422 %s vai para o campo, não para o banner", async (codigo, detalhe, rotulo) => {
  const user = userEvent.setup();
  const criar = vi.fn().mockRejectedValue(new ValidationError(422, codigo, detalhe));
  render(<PessoaInlineModal open onClose={vi.fn()} onCriada={vi.fn()} criar={criar} />);

  await preencherObrigatorios(user);
  await user.click(screen.getByRole("button", { name: "Criar" }));

  expect(await screen.findByText(detalhe)).toBeInTheDocument();
  expect(screen.getByLabelText(rotulo)).toHaveAttribute("aria-invalid", "true");
  expect(screen.getAllByRole("alert")).toHaveLength(1); // só o erro do campo, sem banner
});

test("409 (CPF já cadastrado) vai para o campo CPF", async () => {
  const user = userEvent.setup();
  const criar = vi.fn().mockRejectedValue(new ConflictError(409, "cpf_duplicado", "Já existe uma pessoa com esse CPF"));
  render(<PessoaInlineModal open onClose={vi.fn()} onCriada={vi.fn()} criar={criar} />);

  await preencherObrigatorios(user);
  await user.click(screen.getByRole("button", { name: "Criar" }));

  expect(await screen.findByText("Já existe uma pessoa com esse CPF")).toBeInTheDocument();
  expect(screen.getByLabelText(/^CPF/)).toHaveAttribute("aria-invalid", "true");
});
