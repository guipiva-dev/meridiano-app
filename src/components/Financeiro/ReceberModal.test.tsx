import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as FinanceiroApi from "@/api/financeiro";
import type { MovimentoDto, MovimentoRequest } from "@/api/financeiro";
import { ReceberModal } from "./ReceberModal";

const lancar = vi.fn<(m: MovimentoRequest, motivo?: string) => Promise<MovimentoDto>>();
vi.mock("@/api/financeiro", async (importOriginal) => {
  const mod = await importOriginal<typeof FinanceiroApi>();
  return {
    ...mod,
    financeiroApi: { ...mod.financeiroApi, lancar: (...args: Parameters<typeof lancar>) => lancar(...args) },
  };
});

const item = {
  reservaId: "r1",
  fornecedorNome: "CVC",
  localizador: "K7X2PQ",
  esperado: 960,
  recebido: 0,
  saldo: 960,
};

function movimento(): MovimentoDto {
  return {
    id: "m1",
    versao: "1",
    reservaId: "r1",
    viagemId: "v1",
    codigoViagem: "VG-2026-0001",
    localizador: "K7X2PQ",
    fornecedorNome: "CVC",
    tipo: "recebimento_operadora",
    valor: 960,
    dataMovimento: "2026-04-10",
    formaPagamento: "transferencia",
    observacao: null,
    criadoPorNome: "Ana",
    criadoEm: "2026-04-10T12:00:00Z",
  };
}

afterEach(() => {
  lancar.mockReset();
});

test("valor vem do saldo e o envio é um recebimento da operadora", async () => {
  const user = userEvent.setup();
  const dto = movimento();
  lancar.mockResolvedValue(dto);
  const onRecebido = vi.fn();
  render(<ReceberModal open item={item} onClose={vi.fn()} onRecebido={onRecebido} />);

  expect(screen.getByLabelText(/Valor recebido/)).toHaveValue("R$ 960,00");
  fireEvent.change(screen.getByLabelText(/^Data/), { target: { value: "2026-04-10" } });
  await user.click(screen.getByRole("button", { name: "Confirmar recebimento" }));

  expect(lancar).toHaveBeenCalledWith(
    {
      reservaId: "r1",
      tipo: "recebimento_operadora",
      valor: 960,
      dataMovimento: "2026-04-10",
      formaPagamento: "transferencia",
      observacao: null,
    },
    undefined,
  );
  expect(onRecebido).toHaveBeenCalledWith(dto);
});

test("valor menor que o saldo avisa sobre divergência", async () => {
  const user = userEvent.setup();
  render(<ReceberModal open item={item} onClose={vi.fn()} onRecebido={vi.fn()} />);

  const valor = screen.getByLabelText(/Valor recebido/);
  await user.clear(valor);
  await user.type(valor, "700");

  expect(screen.getByText(/Valor menor que o esperado/)).toBeInTheDocument();
});
