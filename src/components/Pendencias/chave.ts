import { chavesPendencias } from "@/api/pendencias";

/**
 * Prefixo que cobre as duas variantes de `incluirConcluidas` —
 * `chavesPendencias.daViagem` é `["viagens", id, "pendencias", incluirConcluidas]`.
 */
export function chaveDasPendencias(viagemId: string) {
  return chavesPendencias.daViagem(viagemId, false).slice(0, 3);
}
