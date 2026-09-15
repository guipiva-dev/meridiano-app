import { type QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { chavesAuditoria } from "@/api/auditoria";
import { chaves, type ReservaDto, type ViagemDto, viagensApi } from "@/api/viagens";
import { useAuth } from "@/auth/useAuth";
import { chaveDasPendencias } from "@/components/Pendencias/chave";

export type ModalViagem =
  | { tipo: "cancelarReserva" | "remarcar" | "nfse"; reserva: ReservaDto }
  | { tipo: "cancelarViagem" | "transferir" | "usarCredito" };

/** Resposta de uma operação sobre a viagem: substitui a viagem em cache e derruba o que depende dela. */
export function aplicarViagem(qc: QueryClient, id: string, dto: ViagemDto) {
  qc.setQueryData(chaves.viagem(id), dto);
  void qc.invalidateQueries({ queryKey: ["viagens", "lista"] });
  void qc.invalidateQueries({ queryKey: chaveDasPendencias(id) });
  void qc.invalidateQueries({ queryKey: chavesAuditoria.daViagem(id) });
  void qc.invalidateQueries({ queryKey: chaves.creditos(id) });
  // Histórico de alterações e serviços das reservas: chaves ["reservas", <id>, ...].
  void qc.invalidateQueries({ queryKey: ["reservas"] });
}

/** Estado da página de detalhe: dados, permissões, tab (na URL) e modal aberto. */
export function useViagem(id: string) {
  const qc = useQueryClient();
  const { pode } = useAuth();
  const [params, setParams] = useSearchParams();
  const [modal, setModal] = useState<ModalViagem | null>(null);

  const viagemQ = useQuery({ queryKey: chaves.viagem(id), queryFn: () => viagensApi.obter(id) });
  const vendedoresQ = useQuery({ queryKey: chaves.vendedores, queryFn: viagensApi.vendedores });
  const creditosQ = useQuery({
    queryKey: chaves.creditos(id),
    queryFn: () => viagensApi.creditos(id),
    enabled: pode("viagem.editar"),
  });

  const viagem = viagemQ.data;
  // `?reserva=<id>` é o link de "abrir esta reserva": manda para a aba Reservas e abre o card.
  const reservaAberta = params.get("reserva") ?? undefined;
  // A aba Resumo saiu (painel lateral): links antigos `?tab=resumo` caem em Reservas.
  const abaUrl = params.get("tab");
  const tab = reservaAberta ? "reservas" : abaUrl && abaUrl !== "resumo" ? abaUrl : "reservas";

  function trocarUrl(patch: (p: URLSearchParams) => void) {
    setParams(
      (prev) => {
        const proximos = new URLSearchParams(prev);
        patch(proximos);
        return proximos;
      },
      { replace: true },
    );
  }

  function setTab(t: string) {
    trocarUrl((p) => {
      p.delete("reserva");
      if (t === "reservas") p.delete("tab");
      else p.set("tab", t);
    });
  }

  function aplicar(dto: ViagemDto) {
    aplicarViagem(qc, id, dto);
  }

  async function recarregar() {
    await viagemQ.refetch();
  }

  return {
    viagem,
    carregando: viagemQ.isPending,
    erro: viagemQ.isError ? viagemQ.error : undefined,
    recarregar,
    pode,
    verValores: viagem?.reservas[0]?.valorTotal !== undefined || pode("reserva.ver_valores"),
    vendedores: vendedoresQ.data ?? [],
    creditos: creditosQ.data ?? [],
    aplicar,
    tab,
    setTab,
    reservaAberta,
    modal,
    abrir: setModal,
    fechar: () => {
      setModal(null);
    },
  };
}
