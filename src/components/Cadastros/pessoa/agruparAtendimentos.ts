import type { AtendimentoDto } from "@/api/clientes";
import { nomeMes } from "@/lib/datas";

export interface GrupoAtendimentos {
  chave: string;
  titulo: string;
  /** Anos anteriores nascem fechados (`<details>`); o ano corrente fica aberto. */
  recolhido: boolean;
  itens: AtendimentoDto[];
}

/**
 * Ano corrente → um grupo por mês ("Abril de 2026"); anos anteriores → um grupo por ano ("2025").
 * A ordem dos grupos segue a ordem dos itens (a API já devolve do mais recente ao mais antigo).
 */
export function agruparAtendimentos(itens: AtendimentoDto[], hoje: Date): GrupoAtendimentos[] {
  const anoCorrente = String(hoje.getFullYear());
  const grupos: GrupoAtendimentos[] = [];
  for (const item of itens) {
    const ano = item.ocorridoEm.slice(0, 4);
    const doAnoCorrente = ano === anoCorrente;
    const chave = doAnoCorrente ? item.ocorridoEm.slice(0, 7) : ano;
    const existente = grupos.find((g) => g.chave === chave);
    if (existente) existente.itens.push(item);
    else grupos.push({ chave, titulo: doAnoCorrente ? nomeMes(chave) : ano, recolhido: !doAnoCorrente, itens: [item] });
  }
  return grupos;
}
