import type { PendenciaDto } from "@/api/pendencias";
import { formatarData } from "./datas";

/** `https://wa.me/55<dígitos>?text=…`; número com 12–13 dígitos começando em 55 já tem o DDI. */
export function montarLinkWhatsapp({ whatsapp, texto }: { whatsapp: string; texto: string }): string {
  const digitos = whatsapp.replace(/\D/g, "");
  const numero = digitos.startsWith("55") && digitos.length >= 12 ? digitos : `55${digitos}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

type Campos = Pick<
  PendenciaDto,
  "mensagemTipo" | "titularId" | "titularNome" | "titularWhatsapp" | "destino" | "dataIda" | "dataVolta"
>;

/**
 * Mensagem pronta das automáticas de check-in e pós-viagem. O backend só manda `mensagemTipo` (e o contato do titular)
 * nessas duas chaves e para quem vê o cliente.
 */
export function mensagemDaPendencia(p: Campos): { texto: string; resumo: string } | null {
  if (!p.mensagemTipo) return null;
  const nome = (p.titularNome ?? "").trim().split(/\s+/)[0] ?? "";
  if (p.mensagemTipo === "checkin")
    return {
      texto: `Olá, ${nome}! Sua viagem para ${p.destino ?? ""} é em ${formatarData(p.dataIda)}. O check-in online costuma abrir 48 h antes do voo. Qualquer dúvida, estou à disposição.`,
      resumo: "Mensagem de check-in enviada pelo sistema",
    };
  return {
    texto: `Olá, ${nome}! Que bom ter você de volta de ${p.destino ?? ""}. Como foi a viagem? Sua opinião nos ajuda muito.`,
    resumo: "Mensagem de pós-viagem enviada pelo sistema",
  };
}
