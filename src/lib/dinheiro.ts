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
  const limpo = texto
    .replace(/[R$\s−]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  if (limpo === "" || limpo === "-") return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}
