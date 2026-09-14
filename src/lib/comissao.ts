import { arredondar2 } from "@/dominio/calculoReserva";

/** "6", "6,5", "6.25" → número; vazio → null. Até 2 casas (centésimos exatos para o cálculo em centavos). */
export function parsearPercentual(texto: string): number | null | "negativo" | "invalido" {
  const t = texto.trim().replace(/−/g, "-");
  if (t === "") return null;
  if (t.startsWith("-")) return "negativo";
  if (!/^\d+([.,]\d{0,2})?$/.test(t)) return "invalido";
  return Number(t.replace(",", "."));
}

/** % × total em aritmética inteira (centésimos de % × centavos), meio para cima — sem erro de float (5 % de 10,10 = 0,51). */
export function comissaoPorPercentual(percentual: number, total: number | null): number {
  const centesimos = Math.round(percentual * 100);
  const centavos = Math.round((total ?? 0) * 100);
  return Math.round((centesimos * centavos) / 10000) / 100;
}

/** valor / total × 100 com 2 casas; sem total (0 ou vazio) ou sem valor → null. */
export function percentualDaComissao(valor: number | null, total: number | null): number | null {
  if (valor === null || !total) return null;
  return arredondar2((valor * 100) / total);
}
