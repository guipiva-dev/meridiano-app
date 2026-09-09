import { useSearchParams } from "react-router";
import type { FiltroViagens } from "@/api/viagens";
import { hojeIso } from "@/lib/datas";

export type IdaPreset = "90d" | "mes" | "qualquer";

export interface FiltrosViagensPatch {
  aba?: FiltroViagens["aba"];
  q?: string;
  vendedorId?: string;
  tipo?: FiltroViagens["tipo"];
  fornecedorId?: string[];
  nfse?: FiltroViagens["nfse"];
  idaPreset?: IdaPreset;
  compraDe?: string;
  compraAte?: string;
  ordem?: FiltroViagens["ordem"];
  direcao?: FiltroViagens["direcao"];
  pagina?: number;
}

function paraIso(d: Date): string {
  return d.toLocaleDateString("en-CA");
}

/** Converte o preset (URL) no par idaDe/idaAte que a API espera; "qualquer" não filtra. */
function idaDoPreset(preset: IdaPreset): { idaDe?: string; idaAte?: string } {
  if (preset === "qualquer") return {};
  const hoje = new Date(hojeIso());
  if (preset === "mes") {
    const de = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ate = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    return { idaDe: paraIso(de), idaAte: paraIso(ate) };
  }
  const ate = new Date(hoje);
  ate.setDate(ate.getDate() + 90);
  return { idaDe: hojeIso(), idaAte: paraIso(ate) };
}

/** Filtros da lista de viagens vivem na URL (voltar/compartilhar); ver contrato R9 e task-10-brief. */
export function useFiltrosViagens() {
  const [searchParams, setSearchParams] = useSearchParams();

  const idaPreset = (searchParams.get("idaPreset") as IdaPreset | null) ?? "90d";
  const fornecedorId = searchParams.getAll("fornecedorId");
  const compraDe = searchParams.get("compraDe") ?? undefined;
  const compraAte = searchParams.get("compraAte") ?? undefined;
  const tipo = (searchParams.get("tipo") as FiltroViagens["tipo"] | null) ?? undefined;
  const nfse = (searchParams.get("nfse") as FiltroViagens["nfse"] | null) ?? undefined;

  const filtro: FiltroViagens = {
    aba: (searchParams.get("aba") as FiltroViagens["aba"] | null) ?? "todas",
    q: searchParams.get("q") ?? undefined,
    vendedorId: searchParams.get("vendedorId") ?? undefined,
    tipo,
    fornecedorId: fornecedorId.length > 0 ? fornecedorId : undefined,
    nfse,
    ...idaDoPreset(idaPreset),
    compraDe,
    compraAte,
    ordem: (searchParams.get("ordem") as FiltroViagens["ordem"] | null) ?? "ida",
    direcao: (searchParams.get("direcao") as FiltroViagens["direcao"] | null) ?? "desc",
    pagina: Number(searchParams.get("pagina") ?? "1") || 1,
    tamanho: Number(searchParams.get("tamanho") ?? "25") || 25,
  };

  const ativos = [tipo, fornecedorId.length > 0, nfse, compraDe ?? compraAte].filter(Boolean).length;

  function definir(patch: FiltrosViagensPatch) {
    setSearchParams((prev) => {
      const proximos = new URLSearchParams(prev);
      for (const [chave, valor] of Object.entries(patch)) {
        proximos.delete(chave);
        if (valor === undefined || valor === null || valor === "") continue;
        if (Array.isArray(valor)) {
          for (const item of valor as string[]) proximos.append(chave, item);
        } else {
          proximos.set(chave, String(valor));
        }
      }
      if (!("pagina" in patch)) proximos.set("pagina", "1");
      return proximos;
    });
  }

  function limpar() {
    setSearchParams(new URLSearchParams());
  }

  return { filtro, idaPreset, definir, limpar, ativos };
}
