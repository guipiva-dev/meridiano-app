export interface ValoresReserva {
  valorTotal: number;
  valorComissao: number;
  ravOperadora: number;
  /** null = "venda ao cliente" ainda não informada (A03): não é 0, é "—" no resumo. */
  valorCliente: number | null;
  taxaServico: number;
  viaOperadora: boolean;
  cancelada?: boolean;
  comissaoMantida?: boolean;
}

export interface ResultadoReserva {
  /** null quando `valorCliente` da entrada é null (venda ainda não informada): "—" no resumo, nunca um número
   * calculado a partir de venda = 0 (nem RAV = −total, nem esperado/receita bogus). Cancelada ainda zera. */
  ravCliente: number | null;
  valorEsperadoOperadora: number | null;
  receitaPrevista: number | null;
  percentualComissao: number | null;
  /** comissão + RAV (ruling 2026-09-14). Receita = totalComissao + taxa de serviço. */
  totalComissao: number | null;
}

/** Half away from zero, como o `numeric` do Postgres. */
export function arredondar2(n: number): number {
  const s = Math.sign(n);
  return (s * Math.round(Math.abs(n) * 100 + Number.EPSILON)) / 100;
}

function c(n: number): number {
  return Math.round(n * 100);
}

/** Preview em JS das generated columns de `reserva` (spec §4.2). O banco é a autoridade; opera em centavos inteiros para evitar erro de ponto flutuante. */
export function calcularReserva(v: ValoresReserva): ResultadoReserva {
  const total = c(v.valorTotal);
  const com = c(v.valorComissao);
  const rav = c(v.ravOperadora);
  const cli = c(v.valorCliente ?? 0);
  const taxa = c(v.taxaServico);
  const ravCliente = cli - total;
  const zera = Boolean(v.cancelada) && !v.comissaoMantida;
  const cliValido = v.valorCliente !== null || zera; // cancelada zera mesmo sem venda informada
  const esperado = zera ? 0 : com + rav + (v.viaOperadora ? ravCliente : 0);
  const prevista = zera ? 0 : com + rav + ravCliente + taxa;
  const totalCom = zera ? 0 : com + rav + ravCliente;
  const percentual = total > 0 ? arredondar2((100 * com) / total) : null;
  return {
    ravCliente: v.valorCliente === null ? null : ravCliente / 100,
    valorEsperadoOperadora: cliValido ? esperado / 100 : null,
    receitaPrevista: cliValido ? prevista / 100 : null,
    percentualComissao: percentual,
    totalComissao: cliValido ? totalCom / 100 : null,
  };
}
