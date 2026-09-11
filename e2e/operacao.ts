/// <reference types="node" />
import { type APIRequestContext, expect } from "@playwright/test";
import type { ViagemDto } from "@/api/viagens";
import type { CancelarReservaRequest } from "@/api/viagensOperacoes";

/** O `request` do Playwright não passa pelo proxy do Vite: fala direto com a API. */
export const E2E_API = process.env.E2E_API ?? "http://localhost:5000/api/v1";

/**
 * Cancela a primeira reserva da viagem direto pela API (sem reembolso, sem crédito) para gerar o
 * evento "Reserva cancelada" que a Auditoria lista. Reaproveita a sessão de quem chama.
 */
export async function cancelarPrimeiraReservaViaApi(request: APIRequestContext, viagemId: string, motivo: string) {
  const r = await request.get(`${E2E_API}/viagens/${viagemId}`);
  expect(r.ok(), `GET viagem → ${r.status()}`).toBeTruthy();
  const viagem = (await r.json()) as ViagemDto;
  const reserva = viagem.reservas[0];
  expect(reserva, "viagem sem reserva").toBeDefined();

  const body: CancelarReservaRequest = {
    motivo,
    desfecho: "sem_reembolso",
    valorReembolso: null,
    comissaoMantida: false,
    credito: null,
    versao: reserva?.versao ?? "",
  };
  const c = await request.post(`${E2E_API}/reservas/${reserva?.id ?? ""}/cancelar`, { data: body });
  expect(c.ok(), `cancelar reserva → ${c.status()} ${await c.text()}`).toBeTruthy();
}
