import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { DadosFornecedorForm } from "./DadosFornecedorForm";
import type { FormFornecedor } from "./useFornecedor";

function Wrapper({ erros = {} }: { erros?: Record<string, string> }) {
  const form = useForm<FormFornecedor>({
    defaultValues: {
      nome: "",
      tipo: "operadora",
      cnpj: "",
      site: "",
      contato: "",
      telefone: "",
      telefoneEmergencia: "",
      percentualComissaoPadrao: "",
      prazoComissaoDias: "",
      ativo: "true",
      observacoes: "",
    },
  });
  return <DadosFornecedorForm form={form} erros={erros} />;
}

/** Reproduz "/fornecedores/nova": `useFornecedor` não passa `defaultValues`, então nome/cnpj chegam `undefined`. */
function WrapperSemDefaultValues() {
  const form = useForm<FormFornecedor>();
  return <DadosFornecedorForm form={form} erros={{}} />;
}

test("não mostra 'Nome é obrigatório' antes de o usuário interagir com o campo", () => {
  render(<Wrapper />);
  expect(screen.queryByText("Nome é obrigatório")).not.toBeInTheDocument();
});

test("nome vazio, ao sair do campo (blur), mostra erro local", async () => {
  const user = userEvent.setup();
  render(<Wrapper />);

  await user.click(screen.getByLabelText(/^Nome/));
  await user.tab();

  expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();
});

test("CNPJ com dígito verificador inválido mostra erro local", async () => {
  const user = userEvent.setup();
  render(<Wrapper />);

  await user.type(screen.getByLabelText(/^CNPJ/), "12.345.678/0001-00");

  expect(await screen.findByText("CNPJ inválido")).toBeInTheDocument();
});

test("CNPJ com dígito verificador válido não mostra erro", async () => {
  const user = userEvent.setup();
  render(<Wrapper />);

  await user.type(screen.getByLabelText(/^CNPJ/), "11.222.333/0001-81");

  expect(screen.queryByText("CNPJ inválido")).not.toBeInTheDocument();
});

test("erro vindo da API (409 fornecedor_duplicado) prevalece sobre o local", () => {
  render(<Wrapper erros={{ nome: "Já existe com esse nome" }} />);
  expect(screen.getByText("Já existe com esse nome")).toBeInTheDocument();
});

test("form sem defaultValues (novo fornecedor) não quebra ao renderizar nem ao sair do campo Nome", async () => {
  const user = userEvent.setup();
  render(<WrapperSemDefaultValues />);

  await user.click(screen.getByLabelText(/^Nome/));
  await user.tab();

  expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();
});
