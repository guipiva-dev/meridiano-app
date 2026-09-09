import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReservaDto } from "@/api/viagens";
import { ReservaDetalheCard } from "./ReservaDetalheCard";

/** Reserva 2 do protótipo (#s-viagem): Decolar · R$ 3.200,00 · receita R$ 520,00. */
function reservaDto(over: Partial<ReservaDto> = {}): ReservaDto {
  return {
    id: "r2",
    versao: "222",
    fornecedorId: "f2",
    fornecedorNome: "Decolar",
    localizador: "DCL-88213",
    dataCompra: "2026-03-14",
    status: "emitida",
    tiposServico: ["seguro", "traslado"],
    formasPagamento: ["pix"],
    ravClienteModo: "retido_agencia",
    fluxoPagamento: "cliente_paga_operadora",
    nfseStatus: "falta_emitir",
    observacoes: null,
    dataPrevistaComissao: "2026-04-05",
    valorTotal: 3000,
    valorTaxas: 0,
    valorComissao: 270,
    ravOperadora: 0,
    valorCliente: 3200,
    taxaServico: 50,
    receitaPrevista: 520,
    comissaoMantida: false,
    canceladaEm: null,
    motivoCancelamento: null,
    desfechoCancelamento: null,
    nfseTomador: null,
    nfseNumero: null,
    nfseDataEmissao: null,
    conciliacaoEncerrada: false,
    situacaoComissao: "a_receber",
    ...over,
  };
}

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function montar(props: Partial<Parameters<typeof ReservaDetalheCard>[0]> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <ReservaDetalheCard
        indice={2}
        reserva={reservaDto()}
        verValores
        podeEditar
        aberta
        onToggle={() => undefined}
        onEditar={() => undefined}
        onRemarcar={() => undefined}
        onCancelar={() => undefined}
        onNfse={() => undefined}
        {...props}
      />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", () => Promise.resolve(resposta(200, [])));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("fechado mostra só o header", () => {
  montar({ aberta: false });
  expect(screen.getByRole("region", { name: /Reserva 2/ })).toBeInTheDocument();
  expect(screen.getByText("Decolar")).toBeInTheDocument();
  expect(screen.queryByText("Histórico de alterações")).toBeNull();
  expect(screen.getByRole("button", { name: "Expandir" })).toBeInTheDocument();
});

test("aberto mostra o resultado da reserva e as ações", () => {
  montar();
  expect(screen.getByText("Receita da agência").parentElement).toHaveTextContent("R$ 520,00");
  expect(screen.getByText("Histórico de alterações")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Remarcar…" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Cancelar reserva…" })).toBeInTheDocument();
});

test("cancelada mostra o bloco Cancelamento e esconde as ações", () => {
  montar({
    reserva: reservaDto({
      status: "cancelada",
      canceladaEm: "2026-03-20T10:00:00Z",
      motivoCancelamento: "Cliente desistiu",
      desfechoCancelamento: "credito",
      comissaoMantida: true,
    }),
  });
  expect(screen.getByText("Cancelamento")).toBeInTheDocument();
  expect(screen.getByText(/Cliente desistiu/)).toBeInTheDocument();
  expect(screen.getByText("comissão mantida")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Cancelar reserva…" })).toBeNull();
});

test("sem verValores não mostra receita nem o resultado da reserva", () => {
  montar({ verValores: false });
  expect(screen.queryByText(/receita/)).toBeNull();
  expect(screen.queryByText("Receita da agência")).toBeNull();
});
