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

// Ambiguidade que vale a pena recusar já durante a digitação (não espera o blur):
// mais de um separador decimal, ou dígitos além da margem de arredondamento
// (1 casa extra p/ half-away-from-zero) sem separador de milhar coerente.
// Não conta como ambíguo um separador decimal ainda sem fração (ex.: "99,"),
// que é apenas um estado intermediário normal de digitação.
export function textoAmbiguo(texto: string): boolean {
  const semSinal = texto.replace(/[-−]/g, "").replace(/[R$\s]/g, "");
  if ((semSinal.match(/,/g) ?? []).length > 1) return true;
  const idx = semSinal.lastIndexOf(",");
  if (idx !== -1 && semSinal.slice(idx + 1).length > 3) return true;
  return false;
}

export function parsearDinheiro(texto: string): number | null {
  let limpo = texto.trim().replace(/−/g, "-");
  const negativo = limpo.includes("-");
  limpo = limpo.replace(/[R$\s-]/g, "");
  if (limpo === "") return null;

  // Mais de uma vírgula: separador decimal ambíguo (ex.: "1,23,4").
  if ((limpo.match(/,/g) ?? []).length > 1) return null;

  // "1234.56" sem vírgula: ponto é separador decimal, não de milhar.
  const pontoDecimal = !limpo.includes(",") && /^\d+\.\d{1,2}$/.test(limpo);
  if (!pontoDecimal) limpo = limpo.replace(/\./g, "");
  limpo = limpo.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(limpo)) return null;

  // Arredonda em centavos via texto (não float) para bater com numeric do Postgres:
  // half-away-from-zero exato, sem o erro de precisão de Math.round(n * 100).
  const [intPart, fracPart = ""] = limpo.split(".");
  // Mais de 2 casas alem da margem de arredondamento (1 dígito extra p/ half-away-from-zero)
  // é resto de digitação truncada (ex.: "0,00300"), não intenção de sub-centavo: ambíguo.
  if (fracPart.length > 3) return null;
  const centavos = `${fracPart}00`.slice(0, 2);
  const arredondaPraCima = fracPart.length > 2 && fracPart.charCodeAt(2) - 48 >= 5;
  const cents = Number(intPart) * 100 + Number(centavos) + (arredondaPraCima ? 1 : 0);
  const absoluto = cents / 100;
  return negativo && absoluto !== 0 ? -absoluto : absoluto;
}
