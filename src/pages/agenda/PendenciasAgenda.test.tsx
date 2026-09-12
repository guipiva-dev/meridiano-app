import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { AgendaPendenciasDto } from "@/api/agenda";
import type { PendenciaDto } from "@/api/pendencias";
import { PendenciasAgenda } from "./PendenciasAgenda";

function pendencia(over: Partial<PendenciaDto> = {}): PendenciaDto {
  return {
    id: "p1",
    versao: "1",
    titulo: "Confirmar embarque",
    descricao: null,
    dataPrevista: "2026-05-01",
    responsavelId: "u1",
    responsavelNome: "Guilherme",
    clienteId: null,
    clienteNome: null,
    viagemId: null,
    codigoViagem: null,
    status: "aberta",
    origem: "manual",
    prioridade: "normal",
    adiadaDe: null,
    concluidaEm: null,
    atrasada: false,
    ...over,
  };
}

function montar(pendencias: AgendaPendenciasDto) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <PendenciasAgenda pendencias={pendencias} responsavelId={null} podeEditar onEditar={vi.fn()} />
    </QueryClientProvider>,
  );
}

// Achado: adiar uma pendência para a semana que vem a fazia desaparecer da Agenda —
// ela saía de "Esta semana" mas não entrava em lugar nenhum. `proximas` (8-30 dias) cobre esse buraco.
test("seção 'Próximos 30 dias' vem recolhida por padrão e lista os itens de `proximas`", () => {
  montar({
    atrasadas: [],
    hoje: [],
    semana: [],
    proximas: [pendencia({ id: "p9", titulo: "Confirmar embarque" })],
    total: 1,
  });

  const resumo = screen.getByText("Próximos 30 dias 1");
  const details = resumo.closest("details");
  expect(details).not.toBeNull();
  expect(details?.open).toBe(false);
  expect(screen.getByText("Confirmar embarque")).not.toBeVisible();

  fireEvent.click(resumo);

  expect(details?.open).toBe(true);
  expect(screen.getByText("Confirmar embarque")).toBeVisible();
});

test("sem itens em `proximas`, a seção não aparece", () => {
  montar({ atrasadas: [], hoje: [], semana: [], proximas: [], total: 0 });
  expect(screen.queryByText(/Próximos 30 dias/)).toBeNull();
});

test("`proximas` ausente (contrato antigo) não quebra a página", () => {
  montar({ atrasadas: [], hoje: [], semana: [], total: 0 });
  expect(screen.queryByText(/Próximos 30 dias/)).toBeNull();
  expect(screen.getByText("Nada para hoje")).toBeInTheDocument();
});
