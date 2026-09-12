import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { DadosPessoaForm } from "./DadosPessoaForm";
import type { FormPessoa } from "./usePessoa";

function Wrapper({ erros = {} }: { erros?: Record<string, string> }) {
  const form = useForm<FormPessoa>({
    defaultValues: {
      nome: "",
      cpf: "",
      dataNascimento: "",
      grupoId: "",
      cidade: "",
      uf: "",
      origemLead: "",
      whatsapp: "",
      telefone: "",
      email: "",
      contatoEmergencia: "",
      tags: [],
      observacoes: "",
    },
  });
  return <DadosPessoaForm form={form} grupos={[]} erros={erros} verDocumento onNovoGrupo={vi.fn()} />;
}

test("CPF com dígito verificador inválido mostra erro local", async () => {
  const user = userEvent.setup();
  render(<Wrapper />);

  await user.type(screen.getByLabelText(/^CPF/), "123.456.789-00");

  expect(await screen.findByText("CPF inválido")).toBeInTheDocument();
});

test("CPF com dígito verificador válido não mostra erro", async () => {
  const user = userEvent.setup();
  render(<Wrapper />);

  await user.type(screen.getByLabelText(/^CPF/), "529.982.247-25");

  expect(screen.queryByText("CPF inválido")).not.toBeInTheDocument();
});

test("erro vindo da API (422 cpf_invalido) prevalece sobre o local", () => {
  render(<Wrapper erros={{ cpf: "CPF inválido" }} />);
  expect(screen.getByText("CPF inválido")).toBeInTheDocument();
});

test("telefone com letras mostra erro local", async () => {
  const user = userEvent.setup();
  render(<Wrapper />);

  await user.type(screen.getByLabelText("Telefone"), "11a99876567");

  expect(await screen.findByText("Telefone inválido")).toBeInTheDocument();
});

test("telefone só com dígitos, espaços e símbolos não mostra erro", async () => {
  const user = userEvent.setup();
  render(<Wrapper />);

  await user.type(screen.getByLabelText("Telefone"), "(11) 99876-5678");

  expect(screen.queryByText("Telefone inválido")).not.toBeInTheDocument();
});

test("whatsapp com letras mostra erro local", async () => {
  const user = userEvent.setup();
  render(<Wrapper />);

  await user.type(screen.getByLabelText("WhatsApp"), "abc9988877");

  expect(await screen.findByText("Telefone inválido")).toBeInTheDocument();
});
