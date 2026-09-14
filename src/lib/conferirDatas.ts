import type { TipoServico } from "@/api/viagens";

const ROTULOS: Partial<Record<TipoServico, [string, string]>> = {
  aereo: ["Saída", "Chegada"],
  hospedagem: ["Check-in", "Check-out"],
};

/** Rótulos [início, fim] das datas do serviço por tipo — os mesmos do formulário e do aviso. */
export const rotulosDatas = (tipo: TipoServico): [string, string] => ROTULOS[tipo] ?? ["Início", "Fim"];

const diaMes = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/**
 * Avisos (não bloqueantes) de datas do serviço fora da viagem, comparando só o dia (yyyy-mm-dd).
 * Sem data em algum lado → sem aviso daquele lado.
 */
export function conferirDatas(
  servico: { inicio: string | null; fim: string | null },
  viagem: { ida: string | null; volta: string | null },
  tipo: TipoServico,
): string[] {
  const [rotInicio, rotFim] = rotulosDatas(tipo);
  const ida = viagem.ida?.slice(0, 10);
  const volta = viagem.volta?.slice(0, 10);
  const avisos: string[] = [];
  for (const [rotulo, valor] of [
    [rotInicio, servico.inicio],
    [rotFim, servico.fim],
  ] as const) {
    const dia = valor?.slice(0, 10);
    if (!dia) continue;
    if (ida && dia < ida) avisos.push(`${rotulo} ${diaMes(dia)} é antes da ida da viagem (${diaMes(ida)})`);
    else if (volta && dia > volta)
      avisos.push(`${rotulo} ${diaMes(dia)} é depois da volta da viagem (${diaMes(volta)})`);
  }
  return avisos;
}
