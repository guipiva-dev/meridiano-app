import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as FinanceiroApi from "@/api/financeiro";
import type { ConciliacaoItemDto, MovimentoDto } from "@/api/financeiro";
import { ReceberLoteModal } from "./ReceberLoteModal";

const receberLote = vi.fn<(...args: unknown[]) => Promise<{ movimentos: MovimentoDto[] }>>();
vi.mock("@/api/financeiro", async (importOriginal) => {
  const mod = await importOriginal<typeof FinanceiroApi>();
  return {
    ...mod,
    financeiroApi: {
      ...mod.financeiroApi,
      receberLote: (...args: unknown[]) => receberLote(...args),
    },
  };
});

function item(id: string, fornecedor: string): ConciliacaoItemDto {
  return {
    reservaId: id,
    viagemId: "v1",
    codigo: "VG-2026-0001",
    titular: "Carlos",
    destino: "Lisboa",
    localizador: "K7X2PQ",
    fornecedorId: "f1",
    fornecedorNome: fornecedor,
    dataCompra: "2026-03-14",
    dataPrevistaComissao: "2026-04-14",
    situacaoComissao: "a_receber",
    diasAtraso: null,
    esperado: 960,
    recebido: 0,
    saldo: 960,
    conciliacaoEncerrada: false,
    divergenciaMotivo: null,
    ultimoRecebimentoEm: null,
    elegivelLote: true,
  };
}

afterEach(() => {
  receberLote.mockReset();
});

test("soma os saldos no botão e envia os reservaIds", async () => {
  const user = userEvent.setup();
  receberLote.mockResolvedValue({ movimentos: [] });
  const itens = [item("r1", "CVC"), item("r2", "Azul Viagens")];
  const onRecebido = vi.fn();
  render(<ReceberLoteModal open itens={itens} onClose={vi.fn()} onRecebido={onRecebido} />);

  expect(screen.getByText("Marcar 2 comissões como recebidas")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/^Data/), { target: { value: "2026-04-10" } });
  await user.click(screen.getByRole("button", { name: "Confirmar R$ 1.920,00" }));

  expect(receberLote).toHaveBeenCalledWith(["r1", "r2"], "2026-04-10", "transferencia", undefined);
  expect(onRecebido).toHaveBeenCalledWith([]);
});
