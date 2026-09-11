import type { QueryKey } from "@tanstack/react-query";
import { agendaApi, chavesAgenda } from "@/api/agenda";
import { chavesClientes, clientesApi, type ViagemDaPessoaDto } from "@/api/clientes";
import { chavesPendencias, type PendenciaDto, pendenciasApi } from "@/api/pendencias";
import type { PassageiroDto } from "@/api/viagens";
import { chaveDasPendencias, chaveDasPendenciasDaPessoa } from "./chave";

/** R10: a mesma lista serve a viagem (3.3), a pessoa (3.4) e a Agenda (3.6). */
export type EscopoPendencias =
  | { viagemId: string; passageiros: PassageiroDto[] }
  | { clienteId: string; viagens: ViagemDaPessoaDto[] }
  | { agenda: true; responsavelId: string | null };

export interface FontePendencias {
  pessoa: boolean;
  chave: (incluirConcluidas: boolean) => QueryKey;
  buscar: (incluirConcluidas: boolean) => Promise<PendenciaDto[]>;
  /** Prefixo a invalidar depois de qualquer escrita. */
  prefixo: QueryKey;
}

export function fontePendencias(escopo: EscopoPendencias): FontePendencias {
  if ("clienteId" in escopo) {
    const { clienteId } = escopo;
    return {
      pessoa: true,
      chave: (c) => chavesClientes.pendencias(clienteId, c),
      buscar: (c) => clientesApi.pendencias(clienteId, c),
      prefixo: chaveDasPendenciasDaPessoa(clienteId),
    };
  }
  if ("agenda" in escopo) {
    const { responsavelId } = escopo;
    return {
      pessoa: false,
      chave: () => chavesAgenda.lista(responsavelId),
      buscar: () =>
        agendaApi
          .listar(responsavelId)
          .then((a) => [...a.pendencias.atrasadas, ...a.pendencias.hoje, ...a.pendencias.semana]),
      prefixo: ["agenda"],
    };
  }
  const { viagemId } = escopo;
  return {
    pessoa: false,
    chave: (c) => chavesPendencias.daViagem(viagemId, c),
    buscar: (c) => pendenciasApi.daViagem(viagemId, c),
    prefixo: chaveDasPendencias(viagemId),
  };
}
