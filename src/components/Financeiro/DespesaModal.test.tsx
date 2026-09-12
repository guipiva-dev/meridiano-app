import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as DespesasApi from "@/api/despesas";
import type { DespesaCriadaDto, DespesaRequest } from "@/api/despesas";
import { ValidationError } from "@/api/errors";
import { DespesaModal } from "./DespesaModal";

const criar = vi.fn<(d: DespesaRequest, motivo?: string) => Promise<DespesaCriadaDto>>();
vi.mock("@/api/despesas", async (importOriginal) => {
  const mod = await importOriginal<typeof DespesasApi>();
  return {
    ...mod,
    despesasApi: { ...mod.despesasApi, criar: (...args: Parameters<typeof criar>) => criar(...args) },
  };
});

const buscaResposta = {
  clientes: [],
  viagens: [
    {
      id: "v1",
      codigo: "VG-2026-0001",
      destino: "Lisboa",
      titular: "Carlos Mendes",
      dataIda: null,
      faseOperacional: "confirmada",
    },
  ],
  reservas: [],
};

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(buscaResposta), { status: 200, headers: { "content-type": "application/json" } }),
      ),
  );
});

afterEach(() => {
  criar.mockReset();
  vi.unstubAllGlobals();
});

function resultado(): DespesaCriadaDto {
  return { despesa: { id: "d1" } as DespesaCriadaDto["despesa"], proxima: null };
}

test("situação Pago exige data e forma antes de chamar a API", async () => {
  const user = userEvent.setup();
  render(<DespesaModal open fornecedores={[]} onClose={vi.fn()} onSalva={vi.fn()} />);

  await user.type(screen.getByLabelText(/^Descrição/), "Aluguel");
  fireEvent.change(screen.getByLabelText(/^Vencimento/), { target: { value: "2026-04-10" } });
  await user.selectOptions(screen.getByLabelText("Situação"), "pago");
  await user.click(screen.getByRole("button", { name: "Lançar despesa" }));

  expect(criar).not.toHaveBeenCalled();
  expect(screen.getByText("Informe a data do pagamento")).toBeInTheDocument();
  expect(screen.getByText("Informe a forma de pagamento")).toBeInTheDocument();
});

test("repete todo mês revela o campo Repetir até", async () => {
  const user = userEvent.setup();
  render(<DespesaModal open fornecedores={[]} onClose={vi.fn()} onSalva={vi.fn()} />);

  expect(screen.queryByLabelText("Repetir até")).not.toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText("Repete todo mês"), "sim");
  expect(screen.getByLabelText("Repetir até")).toBeInTheDocument();
});

test("escolher uma viagem desliga 'Repete todo mês' e desabilita o campo (despesa recorrente não pode ficar ligada a viagem)", async () => {
  const user = userEvent.setup();
  criar.mockResolvedValue(resultado());
  const onSalva = vi.fn();
  render(<DespesaModal open fornecedores={[]} onClose={vi.fn()} onSalva={onSalva} />);

  await user.type(screen.getByLabelText(/^Descrição/), "Sistema de emissão");
  const valor = screen.getByLabelText(/^Valor/);
  await user.click(valor);
  await user.clear(valor);
  await user.type(valor, "290");
  fireEvent.change(screen.getByLabelText(/^Vencimento/), { target: { value: "2026-04-10" } });
  await user.selectOptions(screen.getByLabelText("Repete todo mês"), "sim");
  await user.type(screen.getByRole("combobox", { name: "Viagem" }), "Lisboa");
  const opcao = await screen.findByRole("option", { name: /Lisboa/ });
  await user.click(opcao);

  const repeteSelect = screen.getByLabelText("Repete todo mês");
  expect(repeteSelect).toHaveValue("nao");
  expect(repeteSelect).toBeDisabled();
  expect(screen.getByText("Despesa ligada a viagem não repete")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Lançar despesa" }));

  await waitFor(() => {
    expect(criar).toHaveBeenCalledWith(
      expect.objectContaining({
        descricao: "Sistema de emissão",
        valor: 290,
        vencimento: "2026-04-10",
        recorrente: false,
        recorrenciaAte: null,
        viagemId: "v1",
        pago: false,
        pagoEm: null,
      }),
      undefined,
    );
  });
  expect(onSalva).toHaveBeenCalledWith(expect.objectContaining({ id: "d1" }), null);
});

test("despesa com viagem fixa (lançada na aba da viagem) já abre com 'Repete todo mês' desabilitado", () => {
  render(
    <DespesaModal
      open
      viagemFixa={{ id: "v1", rotulo: "VG-2026-0001" }}
      fornecedores={[]}
      onClose={vi.fn()}
      onSalva={vi.fn()}
    />,
  );

  expect(screen.getByLabelText("Repete todo mês")).toBeDisabled();
  expect(screen.getByText("Despesa ligada a viagem não repete")).toBeInTheDocument();
});

test("descrição tem maxLength 200", () => {
  render(<DespesaModal open fornecedores={[]} onClose={vi.fn()} onSalva={vi.fn()} />);
  expect(screen.getByLabelText(/^Descrição/)).toHaveAttribute("maxLength", "200");
});

test("observação tem maxLength 2000 e mostra contador N/2000", async () => {
  const user = userEvent.setup();
  render(<DespesaModal open fornecedores={[]} onClose={vi.fn()} onSalva={vi.fn()} />);

  const observacao = screen.getByLabelText("Observação");
  expect(observacao).toHaveAttribute("maxLength", "2000");
  expect(screen.getByText("0/2000")).toBeInTheDocument();

  await user.type(observacao, "abc");

  expect(screen.getByText("3/2000")).toBeInTheDocument();
});

test("422 texto_longo em observacao vira erro inline no campo Observação, sem Alert de bloco", async () => {
  const user = userEvent.setup();
  criar.mockRejectedValue(
    new ValidationError(422, "texto_longo", "observacao deve ter no máximo 2000 caracteres", { campo: "observacao" }),
  );
  render(<DespesaModal open fornecedores={[]} onClose={vi.fn()} onSalva={vi.fn()} />);

  await user.type(screen.getByLabelText(/^Descrição/), "Aluguel");
  fireEvent.change(screen.getByLabelText(/^Vencimento/), { target: { value: "2026-04-10" } });
  await user.click(screen.getByRole("button", { name: "Lançar despesa" }));

  await waitFor(() => {
    expect(screen.getByLabelText("Observação")).toHaveAccessibleDescription(/no máximo 2000/);
  });
  expect(screen.getByRole("alert")).toHaveTextContent("observacao deve ter no máximo 2000 caracteres");
});
