import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as RepassesApi from "@/api/repasses";
import type { RepasseItemDto, VendedorRepassesDto } from "@/api/repasses";
import { VendedorCard } from "./VendedorCard";

const definirValor = vi.fn<(...args: unknown[]) => Promise<RepasseItemDto>>();
vi.mock("@/api/repasses", async (importOriginal) => {
  const mod = await importOriginal<typeof RepassesApi>();
  return {
    ...mod,
    repassesApi: { ...mod.repassesApi, definirValor: (...args: unknown[]) => definirValor(...args) },
  };
});

function item(over: Partial<RepasseItemDto>): RepasseItemDto {
  return {
    id: "rp1",
    versao: "1",
    viagemId: "v1",
    codigo: "VG-2026-0038",
    titular: "Família Oliveira",
    destino: "Gramado",
    usuarioId: "u1",
    valor: 250,
    status: "a_pagar",
    liberadoEm: "2026-04-02T10:00:00Z",
    pagoEm: null,
    observacao: null,
    aguardando: 0,
    ultimoRecebimentoEm: "2026-04-02",
    ...over,
  };
}

// Cenário do protótipo (docs/design/prototipo-v1.html, tela Financeiro · Repasses, card Ana Paula Ribeiro).
const ITENS = [
  item({ id: "rp1", codigo: "VG-2026-0038", titular: "Família Oliveira", destino: "Gramado", valor: 250, ultimoRecebimentoEm: "2026-04-02" }),
  item({ id: "rp2", codigo: "VG-2026-0035", titular: "Juliana Prado", destino: "Buenos Aires", valor: 200, ultimoRecebimentoEm: "2026-03-28" }),
  item({ id: "rp3", codigo: "VG-2026-0033", titular: "Roberto Tanaka", destino: "Orlando", valor: 400, ultimoRecebimentoEm: "2026-03-30" }),
  item({
    id: "rp4",
    versao: "3",
    codigo: "VG-2026-0044",
    titular: "Turma do Pilates",
    destino: "Maragogi",
    valor: null,
    ultimoRecebimentoEm: null,
  }),
];

const VENDEDOR: VendedorRepassesDto = {
  usuarioId: "u1",
  nome: "Ana Paula Ribeiro",
  viagensAno: 12,
  aPagarValor: 850,
  aPagarViagens: 3,
  itens: ITENS,
};

afterEach(() => {
  definirValor.mockReset();
});

test("mostra os itens do protótipo com a comissão recebida e o badge de valor pendente", () => {
  render(<VendedorCard vendedor={VENDEDOR} ano={2026} historico={false} podePagar onPagar={vi.fn()} onValorSalvo={vi.fn()} />);

  expect(screen.getByText("Ana Paula Ribeiro")).toBeInTheDocument();
  expect(screen.getByText(/vendedor\(a\) externo\(a\) · 12 viagens em 2026/)).toBeInTheDocument();
  expect(screen.getByText("Família Oliveira · Gramado")).toBeInTheDocument();
  expect(screen.getByText(/comissão recebida 02\/04/)).toBeInTheDocument();
  expect(screen.getByText(/sem valor definido/)).toBeInTheDocument();
  expect(screen.getByText("informar valor")).toBeInTheDocument();
});

test("digitar valor e Enter chama definirValor com a versão do item", async () => {
  definirValor.mockResolvedValue(item({ id: "rp4", versao: "3", valor: 300 }));
  const onValorSalvo = vi.fn();
  render(
    <VendedorCard vendedor={VENDEDOR} ano={2026} historico={false} podePagar onPagar={vi.fn()} onValorSalvo={onValorSalvo} />,
  );

  const input = screen.getByLabelText("Valor do repasse de VG-2026-0044");
  fireEvent.change(input, { target: { value: "300,00" } });
  fireEvent.keyDown(input, { key: "Enter" });

  await waitFor(() => {
    expect(definirValor).toHaveBeenCalledWith("rp4", 300, "3");
  });
  expect(onValorSalvo).toHaveBeenCalled();
});

test("Pagar R$ 850,00 chama onPagar com os itens liberados", async () => {
  const user = userEvent.setup();
  const onPagar = vi.fn();
  render(<VendedorCard vendedor={VENDEDOR} ano={2026} historico={false} podePagar onPagar={onPagar} onValorSalvo={vi.fn()} />);

  await user.click(screen.getByRole("button", { name: "Pagar R$ 850,00" }));
  expect(onPagar).toHaveBeenCalledWith([ITENS[0], ITENS[1], ITENS[2]]);
});
