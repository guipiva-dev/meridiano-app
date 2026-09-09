import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { chavesAuditoria } from "@/api/auditoria";
import { chaves, type ReservaDto, type ViagemDto, viagensApi } from "@/api/viagens";
import { useAuth } from "@/auth/useAuth";
import { chaveDasPendencias } from "@/components/Pendencias/chave";

export type ModalViagem =
  | { tipo: "cancelarReserva" | "remarcar" | "nfse"; reserva: ReservaDto }
  | { tipo: "cancelarViagem" | "transferir" | "usarCredito" };

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
  const tab = reservaAberta ? "reservas" : (params.get("tab") ?? "resumo");

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
      if (t === "resumo") p.delete("tab");
      else p.set("tab", t);
    });
  }

  function abrirReserva(reservaId: string) {
    trocarUrl((p) => {
      p.delete("tab");
      p.set("reserva", reservaId);
    });
  }

  /** Resposta de uma operação: substitui a viagem em cache e derruba o que depende dela. */
  function aplicar(dto: ViagemDto) {
    qc.setQueryData(chaves.viagem(id), dto);
    void qc.invalidateQueries({ queryKey: ["viagens", "lista"] });
    void qc.invalidateQueries({ queryKey: chaveDasPendencias(id) });
    void qc.invalidateQueries({ queryKey: chavesAuditoria.daViagem(id) });
    void qc.invalidateQueries({ queryKey: chaves.creditos(id) });
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
    abrirReserva,
    modal,
    abrir: setModal,
    fechar: () => {
      setModal(null);
    },
  };
}
