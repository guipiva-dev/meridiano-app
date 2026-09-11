import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chavesAgenda } from "@/api/agenda";
import { mensagemDeErro } from "@/api/http";
import { type PendenciaDto, pendenciasApi } from "@/api/pendencias";
import { toast } from "@/components/feedback";
import type { FontePendencias } from "./escopo";

/**
 * Mutations de concluir/excluir compartilhadas por `ListaPendencias` (viagem/pessoa) e
 * `PendenciasAgenda` — cada uma invalida o prefixo da sua própria fonte.
 */
export function usePendenciasAcoes(fonte: FontePendencias) {
  const qc = useQueryClient();

  function invalidar() {
    void qc.invalidateQueries({ queryKey: fonte.prefixo });
    void qc.invalidateQueries({ queryKey: chavesAgenda.badges() });
  }
  function falhou(e: unknown) {
    toast.error(mensagemDeErro(e));
    invalidar();
  }

  const concluir = useMutation({
    mutationFn: (p: PendenciaDto) => pendenciasApi.concluir(p.id, p.versao),
    onSuccess: invalidar,
    onError: falhou,
  });
  const excluir = useMutation({
    mutationFn: (p: PendenciaDto) => pendenciasApi.cancelar(p.id),
    onSuccess: invalidar,
    onError: falhou,
  });

  return { concluir, excluir, invalidar };
}
