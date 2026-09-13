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

function WrapperSemDocumento() {
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
  return <DadosPessoaForm form={form} grupos={[]} erros={{}} verDocumento={false} onNovoGrupo={vi.fn()} />;
}

test("verDocumento false esconde o campo CPF", () => {
  render(<WrapperSemDocumento />);
  expect(screen.queryByLabelText(/^CPF/)).not.toBeInTheDocument();
});

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

test("CPF e Nascimento são obrigatórios", () => {
  render(<Wrapper />);
  expect(screen.getByLabelText(/^CPF/)).toBeRequired();
  expect(screen.getByLabelText(/^Nascimento/)).toBeRequired();
});

test("422 cpf_obrigatorio mostra 'Informe o CPF' no campo CPF", () => {
  render(<Wrapper erros={{ cpf: "Informe o CPF" }} />);
  expect(screen.getByText("Informe o CPF")).toBeInTheDocument();
});

test("422 data_nascimento_obrigatoria mostra 'Informe a data de nascimento' no campo Nascimento", () => {
  render(<Wrapper erros={{ dataNascimento: "Informe a data de nascimento" }} />);
  expect(screen.getByText("Informe a data de nascimento")).toBeInTheDocument();
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

test("nome tem maxLength 150", () => {
  render(<Wrapper />);
  expect(screen.getByLabelText(/^Nome completo/)).toHaveAttribute("maxLength", "150");
});

test("cidade tem maxLength 80", () => {
  render(<Wrapper />);
  expect(screen.getByLabelText("Cidade")).toHaveAttribute("maxLength", "80");
});

test("observações tem maxLength 2000 e mostra contador N/2000", async () => {
  const user = userEvent.setup();
  render(<Wrapper />);

  const observacoes = screen.getByLabelText("Observações");
  expect(observacoes).toHaveAttribute("maxLength", "2000");
  expect(screen.getByText("0/2000")).toBeInTheDocument();

  await user.type(observacoes, "abc");

  expect(screen.getByText("3/2000")).toBeInTheDocument();
});
