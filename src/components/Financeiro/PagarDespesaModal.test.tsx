import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as DespesasApi from "@/api/despesas";
import type { DespesaCriadaDto, DespesaDto } from "@/api/despesas";
import { PagarDespesaModal } from "./PagarDespesaModal";

const pagar = vi.fn<(...args: unknown[]) => Promise<DespesaCriadaDto>>();
vi.mock("@/api/despesas", async (importOriginal) => {
  const mod = await importOriginal<typeof DespesasApi>();
  return {
    ...mod,
    despesasApi: { ...mod.despesasApi, pagar: (...args: unknown[]) => pagar(...args) },
  };
});

function despesa(): DespesaDto {
  return {
    id: "d1",
    versao: "4",
    descricao: "Aluguel da sala",
    categoria: "fixo",
    valor: 1800,
    vencimento: "2026-04-10",
    pago: false,
    pagoEm: null,
    formaPagamento: null,
    recorrente: true,
    recorrenciaAte: null,
    recorrenciaOrigemId: null,
    viagemId: null,
    codigoViagem: null,
    tituloViagem: null,
    fornecedorId: null,
    fornecedorNome: null,
    observacao: null,
    situacao: "a_pagar",
  };
}

afterEach(() => {
  pagar.mockReset();
});

test("envia pagoEm, forma e versão, e devolve a próxima ocorrência", async () => {
  const user = userEvent.setup();
  const d = despesa();
  const proxima = { ...d, id: "d2", vencimento: "2026-05-10" };
  pagar.mockResolvedValue({ despesa: { ...d, pago: true }, proxima });
  const onPaga = vi.fn();
  render(<PagarDespesaModal open despesa={d} onClose={vi.fn()} onPaga={onPaga} />);

  expect(screen.getByText("R$ 1.800,00 · vencimento 10/04/2026")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/^Pago em/), { target: { value: "2026-04-09" } });
  await user.selectOptions(screen.getByLabelText(/^Forma de pagamento/), "pix");
  await user.click(screen.getByRole("button", { name: "Confirmar pagamento" }));

  expect(pagar).toHaveBeenCalledWith("d1", "2026-04-09", "pix", "4", undefined);
  expect(onPaga).toHaveBeenCalledWith(expect.objectContaining({ pago: true }), proxima);
});

test("sem forma escolhida não chama a API", async () => {
  const user = userEvent.setup();
  render(<PagarDespesaModal open despesa={despesa()} onClose={vi.fn()} onPaga={vi.fn()} />);

  await user.click(screen.getByRole("button", { name: "Confirmar pagamento" }));

  expect(pagar).not.toHaveBeenCalled();
  expect(screen.getByText("Informe a forma de pagamento")).toBeInTheDocument();
});
