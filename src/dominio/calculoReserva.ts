export interface ValoresReserva {
  valorTotal: number;
  valorComissao: number;
  ravOperadora: number;
  valorCliente: number;
  taxaServico: number;
  viaOperadora: boolean;
  cancelada?: boolean;
  comissaoMantida?: boolean;
}

export interface ResultadoReserva {
  ravCliente: number;
  valorEsperadoOperadora: number;
  receitaPrevista: number;
  percentualComissao: number | null;
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
  const cli = c(v.valorCliente);
  const taxa = c(v.taxaServico);
  const ravCliente = cli - total;
  const zera = Boolean(v.cancelada) && !v.comissaoMantida;
  const esperado = zera ? 0 : com + rav + (v.viaOperadora ? ravCliente : 0);
  const prevista = zera ? 0 : com + rav + ravCliente + taxa;
  const percentual = total > 0 ? arredondar2((100 * com) / total) : null;
  return {
    ravCliente: ravCliente / 100,
    valorEsperadoOperadora: esperado / 100,
    receitaPrevista: prevista / 100,
    percentualComissao: percentual,
  };
}
