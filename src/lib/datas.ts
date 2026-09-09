/** yyyy-mm-dd (ou yyyy-mm-ddTHH:mm...) → dd/mm/yyyy. */
export function formatarData(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

/** yyyy-mm-ddTHH:mm:ss → dd/mm/yyyy HH:mm. */
export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [data, hora] = iso.split("T");
  const dataFmt = formatarData(data);
  return hora ? `${dataFmt} ${hora.slice(0, 5)}` : dataFmt;
}

/** `timestamptz` (offset explícito) → data/hora no fuso do navegador. Para `timestamp`/`DateOnly` use `formatarDataHora`/`formatarData`. */
export function formatarCarimbo(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/**
 * Período ida–volta, comprimido quando mês/ano coincidem:
 * "18–28/04/2026" (mesmo mês) · "28/04–02/05/2026" (mesmo ano) · "18/04/2026–02/01/2027" ·
 * só ida → "18/04/2026" · nada → "—".
 */
export function formatarPeriodo(ida: string | null, volta: string | null): string {
  if (!ida) return "—";
  if (!volta) return formatarData(ida);
  const [anoI, mesI, diaI] = ida.slice(0, 10).split("-");
  const [anoV, mesV, diaV] = volta.slice(0, 10).split("-");
  if (anoI === anoV && mesI === mesV) return `${diaI}–${diaV}/${mesV}/${anoV}`;
  if (anoI === anoV) return `${diaI}/${mesI}–${diaV}/${mesV}/${anoV}`;
  return `${formatarData(ida)}–${formatarData(volta)}`;
}

/** yyyy-mm-dd local (mesma receita de reservaVazia). */
export function hojeIso(): string {
  return new Date().toLocaleDateString("en-CA");
}

/** Dias entre hoje e `iso` (yyyy-mm-dd); negativo se passado. */
export function diasAte(iso: string): number {
  const hoje = new Date(hojeIso());
  const alvo = new Date(iso.slice(0, 10));
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000);
}
