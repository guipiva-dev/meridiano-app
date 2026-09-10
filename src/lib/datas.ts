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

/** Anos completos entre `nascimentoIso` (yyyy-mm-dd) e hoje; null sem data. */
export function idade(nascimentoIso: string | null | undefined): number | null {
  if (!nascimentoIso) return null;
  const hoje = hojeIso();
  let anos = Number(hoje.slice(0, 4)) - Number(nascimentoIso.slice(0, 4));
  if (hoje.slice(5, 10) < nascimentoIso.slice(5, 10)) anos -= 1;
  return anos;
}

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** Nome do mês de um yyyy-mm ou yyyy-mm-dd. */
function nomeDoMes(iso: string): string {
  return MESES[Number(iso.slice(5, 7)) - 1] ?? "";
}

/** yyyy-mm-dd → "abr/2026"; null → "—". */
export function formatarMesAno(iso: string | null | undefined): string {
  if (!iso) return "—";
  return `${nomeDoMes(iso).slice(0, 3)}/${iso.slice(0, 4)}`;
}

/** Competência yyyy-mm → "Abril de 2026". */
export function nomeMes(competencia: string): string {
  const nome = nomeDoMes(competencia);
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${competencia.slice(0, 4)}`;
}

/** Competência yyyy-mm do mês corrente (local). */
export function competenciaAtual(): string {
  return hojeIso().slice(0, 7);
}

/** yyyy-mm-dd → yyyy-mm. */
export function competenciaDe(iso: string): string {
  return iso.slice(0, 7);
}

/** Competência yyyy-mm somada de `n` meses, virando o ano. */
export function somarMeses(competencia: string, n: number): string {
  const total = Number(competencia.slice(0, 4)) * 12 + Number(competencia.slice(5, 7)) - 1 + n;
  return `${String(Math.floor(total / 12)).padStart(4, "0")}-${String((total % 12) + 1).padStart(2, "0")}`;
}
