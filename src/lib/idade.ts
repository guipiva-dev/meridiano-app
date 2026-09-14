import { idade } from "./datas";
import { plural } from "./plural";

/** `< 2` → "bebê"; `2–11` → "criança"; `≥ 12` → null. */
export function faixaEtaria(anos: number): string | null {
  if (anos < 2) return "bebê";
  if (anos < 12) return "criança";
  return null;
}

/** "7 anos · criança" na `dataRef` (sem ela ou "", hoje local); sem nascimento → null. */
export function textoIdade(nascimento: string | null | undefined, dataRef: string | null | undefined): string | null {
  const anos = idade(nascimento, dataRef ?? undefined);
  if (anos === null) return null;
  const faixa = faixaEtaria(anos);
  return faixa ? `${plural(anos, "ano", "anos")} · ${faixa}` : plural(anos, "ano", "anos");
}
