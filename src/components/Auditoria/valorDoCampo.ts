import { formatarData } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";

const CAMPOS_DINHEIRO = /^(valor_|rav_|taxa_|multa_)/;
const DATA_ISO = /^\d{4}-\d{2}-\d{2}/;

/** Valor de `alteracoes` (auditoria): dinheiro nos campos conhecidos, booleano em Sim/Não, data ISO formatada; o resto vira texto (JSON para objeto/array). */
export function valorDoCampo(campo: string, valor: unknown): string {
  if (valor === null || valor === undefined) return "—";
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (typeof valor === "number" && CAMPOS_DINHEIRO.test(campo)) return formatarDinheiro(valor);
  if (typeof valor === "string" && DATA_ISO.test(valor)) return formatarData(valor);
  return typeof valor === "string" ? valor : JSON.stringify(valor);
}
