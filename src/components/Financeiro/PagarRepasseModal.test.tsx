import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as RepassesApi from "@/api/repasses";
import type { RepasseItemDto, VendedorRepassesDto } from "@/api/repasses";
import { PagarRepasseModal } from "./PagarRepasseModal";

const pagarLote = vi.fn<(...args: unknown[]) => Promise<{ pagos: RepasseItemDto[] }>>();
vi.mock("@/api/repasses", async (importOriginal) => {
  const mod = await importOriginal<typeof RepassesApi>();
  return {
    ...mod,
    repassesApi: { ...mod.repassesApi, pagarLote: (...args: unknown[]) => pagarLote(...args) },
  };
});

function item(id: string, valor: number): RepasseItemDto {
  return {
    id,
    versao: "1",
    viagemId: `v-${id}`,
    codigo: "VG-2026-0001",
    titular: "Carlos",
    destino: "Lisboa",
    usuarioId: "u1",
    valor,
    status: "a_pagar",
    liberadoEm: "2026-04-01T10:00:00Z",
    pagoEm: null,
    observacao: null,
    aguardando: 0,
    ultimoRecebimentoEm: "2026-04-01",
  };
}

const vendedor: VendedorRepassesDto = {
  usuarioId: "u1",
  nome: "Ana Souza",
  viagensAno: 12,
  aPagarValor: 750,
  aPagarViagens: 2,
  itens: [],
};

afterEach(() => {
  pagarLote.mockReset();
});

test("título soma os itens e o envio manda os repasseIds", async () => {
  const user = userEvent.setup();
  const itens = [item("rp1", 500), item("rp2", 250)];
  pagarLote.mockResolvedValue({ pagos: itens });
  const onPagos = vi.fn();
  render(<PagarRepasseModal open vendedor={vendedor} itens={itens} onClose={vi.fn()} onPagos={onPagos} />);

  expect(screen.getByText("Pagar R$ 750,00 a Ana Souza?")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/^Pago em/), { target: { value: "2026-04-30" } });
  await user.type(screen.getByLabelText("Observação"), "PIX enviado");
  await user.click(screen.getByRole("button", { name: "Confirmar pagamento" }));

  expect(pagarLote).toHaveBeenCalledWith(["rp1", "rp2"], "2026-04-30", "PIX enviado", undefined);
  expect(onPagos).toHaveBeenCalledWith(itens);
});
