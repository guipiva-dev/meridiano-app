import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as DespesasApi from "@/api/despesas";
import type { DespesaCriadaDto, DespesaRequest } from "@/api/despesas";
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

test("envia recorrente e a viagem escolhida na combobox", async () => {
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
  await user.click(screen.getByRole("button", { name: "Lançar despesa" }));

  await waitFor(() => {
    expect(criar).toHaveBeenCalledWith(
      expect.objectContaining({
        descricao: "Sistema de emissão",
        valor: 290,
        vencimento: "2026-04-10",
        recorrente: true,
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
