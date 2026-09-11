import { useSearchParams } from "react-router";
import type { FiltroClientes } from "@/api/clientes";

/** Filtros da lista de pessoas vivem na URL (voltar/compartilhar); ver contrato R9. */
export function useFiltrosClientes() {
  const [searchParams, setSearchParams] = useSearchParams();

  const ultimaViagem = (searchParams.get("ultimaViagem") as FiltroClientes["ultimaViagem"] | null) ?? undefined;
  const filtro: FiltroClientes = {
    q: searchParams.get("q") ?? undefined,
    grupoId: searchParams.get("grupoId") ?? undefined,
    pendencia: (searchParams.get("pendencia") as FiltroClientes["pendencia"] | null) ?? undefined,
    ultimaViagem,
    ordem: (searchParams.get("ordem") as FiltroClientes["ordem"] | null) ?? "nome",
    direcao: (searchParams.get("direcao") as FiltroClientes["direcao"] | null) ?? "asc",
    pagina: Number(searchParams.get("pagina") ?? "1") || 1,
    tamanho: Number(searchParams.get("tamanho") ?? "25") || 25,
  };

  // Só "Última viagem" mora no painel "Filtros"; busca, grupo e pendência ficam sempre visíveis.
  const ativos = ultimaViagem ? 1 : 0;

  function definir(patch: Partial<FiltroClientes>) {
    setSearchParams((prev) => {
      const proximos = new URLSearchParams(prev);
      for (const [chave, valor] of Object.entries(patch) as [string, string | number | undefined][]) {
        proximos.delete(chave);
        if (valor === undefined || valor === "") continue;
        proximos.set(chave, String(valor));
      }
      if (!("pagina" in patch)) proximos.set("pagina", "1");
      return proximos;
    });
  }

  function limpar() {
    setSearchParams(new URLSearchParams());
  }

  return { filtro, definir, limpar, ativos };
}
