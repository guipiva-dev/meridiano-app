const fmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatarDinheiro(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "";
  const texto = fmt.format(Math.abs(valor)).replace(/\u00A0/g, " ");
  return valor < 0 ? `−${texto}` : texto;
}

export function parsearDinheiro(texto: string): number | null {
  let limpo = texto.trim().replace(/−/g, "-");
  const negativo = limpo.includes("-");
  limpo = limpo.replace(/[R$\s-]/g, "");
  if (limpo === "") return null;

  // "1234.56" sem vírgula: ponto é separador decimal, não de milhar.
  const pontoDecimal = !limpo.includes(",") && /^\d+\.\d{1,2}$/.test(limpo);
  if (!pontoDecimal) limpo = limpo.replace(/\./g, "");
  limpo = limpo.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(limpo)) return null;

  // Arredonda em centavos via texto (não float) para bater com numeric do Postgres:
  // half-away-from-zero exato, sem o erro de precisão de Math.round(n * 100).
  const [intPart, fracPart = ""] = limpo.split(".");
  const centavos = `${fracPart}00`.slice(0, 2);
  const arredondaPraCima = fracPart.length > 2 && fracPart.charCodeAt(2) - 48 >= 5;
  const cents = Number(intPart) * 100 + Number(centavos) + (arredondaPraCima ? 1 : 0);
  const absoluto = cents / 100;
  return negativo && absoluto !== 0 ? -absoluto : absoluto;
}
