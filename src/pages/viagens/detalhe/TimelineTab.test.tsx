import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { EventoAuditoriaDto } from "@/api/auditoria";
import { formatarCarimbo } from "@/lib/datas";
import { TimelineTab } from "./TimelineTab";

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

const EVENTOS: EventoAuditoriaDto[] = [
  {
    id: 2,
    tabela: "reserva",
    registroId: "r1",
    acao: "UPDATE",
    titulo: "Valores da reserva alterados",
    subtitulo: "CVC Operadora · K7X2PQ",
    alteracoes: { valor_comissao: { de: 1000, para: 2000 }, status: { de: "pendente", para: "emitida" } },
    motivo: "Ajuste da operadora",
    usuarioNome: "Ana Paula",
    criadoEm: "2026-03-14T09:30:00+00:00",
  },
  {
    id: 1,
    tabela: "viagem",
    registroId: "v1",
    acao: "INSERT",
    titulo: "Viagem criada",
    subtitulo: null,
    alteracoes: {},
    motivo: null,
    usuarioNome: null,
    criadoEm: "2026-02-10T08:00:00+00:00",
  },
];

function montar(eventos: EventoAuditoriaDto[] = EVENTOS) {
  vi.stubGlobal("fetch", () => Promise.resolve(resposta(200, eventos)));
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <TimelineTab viagemId="v1" />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("lista título, subtítulo, carimbo e usuário (sistema quando não há)", async () => {
  montar();
  expect(await screen.findByText("Valores da reserva alterados")).toBeInTheDocument();
  expect(screen.getByText("CVC Operadora · K7X2PQ")).toBeInTheDocument();
  // `criado_em` é timestamptz: o carimbo sai no fuso local, não fatiado da string UTC.
  expect(screen.getByText(`${formatarCarimbo("2026-03-14T09:30:00+00:00")} · Ana Paula`)).toBeInTheDocument();
  expect(screen.getByText("Motivo: Ajuste da operadora")).toBeInTheDocument();
  expect(screen.getByText(`${formatarCarimbo("2026-02-10T08:00:00+00:00")} · sistema`)).toBeInTheDocument();
});

test("Ver detalhes mostra valor_comissao com os valores em reais", async () => {
  montar();
  fireEvent.click(await screen.findByText("Ver detalhes"));
  const linha = screen.getByRole("rowheader", { name: "valor_comissao" }).closest("tr");
  expect(linha).toHaveTextContent("R$ 1.000,00");
  expect(linha).toHaveTextContent("R$ 2.000,00");
});

test("evento sem alterações não mostra Ver detalhes", async () => {
  montar([EVENTOS[1]!]);
  await screen.findByText("Viagem criada");
  expect(screen.queryByText("Ver detalhes")).toBeNull();
});
