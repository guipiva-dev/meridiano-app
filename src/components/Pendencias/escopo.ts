import type { QueryKey } from "@tanstack/react-query";
import { chavesClientes, clientesApi, type ViagemDaPessoaDto } from "@/api/clientes";
import { chavesPendencias, type PendenciaDto, pendenciasApi } from "@/api/pendencias";
import type { PassageiroDto } from "@/api/viagens";
import { chaveDasPendencias, chaveDasPendenciasDaPessoa } from "./chave";

/** R10: a mesma lista serve a viagem (3.3) e a pessoa (3.4). */
export type EscopoPendencias =
  | { viagemId: string; passageiros: PassageiroDto[] }
  | { clienteId: string; viagens: ViagemDaPessoaDto[] };

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
  const { viagemId } = escopo;
  return {
    pessoa: false,
    chave: (c) => chavesPendencias.daViagem(viagemId, c),
    buscar: (c) => pendenciasApi.daViagem(viagemId, c),
    prefixo: chaveDasPendencias(viagemId),
  };
}
