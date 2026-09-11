import type { Tone } from "@/dominio/status";

/** UFs em ordem alfabética pelo nome do estado. */
export const UFS: readonly string[] = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

export function somenteDigitos(s: string): string {
  return s.replace(/\D/g, "");
}

export function formatarCpf(digitos: string | null | undefined): string {
  const d = somenteDigitos(digitos ?? "");
  if (!d) return "";
  return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*$/, "$1.$2.$3-$4");
}

export function formatarCnpj(digitos: string | null | undefined): string {
  const d = somenteDigitos(digitos ?? "");
  if (!d) return "";
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*$/, "$1.$2.$3/$4-$5");
}

/** 11 dígitos → celular; 10 → fixo; senão devolve `s` como veio. */
export function formatarTelefone(s: string | null | undefined): string {
  if (!s) return "";
  const d = somenteDigitos(s);
  if (d.length === 11) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  return s;
}

/** Situação de vencimento de um documento a partir de `diasParaVencer` (DocumentoDto). */
export function situacaoValidade(dias: number | null): { texto: string; tone: Tone } {
  if (dias === null) return { texto: "—", tone: "neutral" };
  if (dias < 0) return { texto: `vencido há ${Math.abs(dias)} dias`, tone: "danger" };
  if (dias <= 180) return { texto: `${dias} dias`, tone: "warning" };
  return { texto: `${dias} dias`, tone: "neutral" };
}
