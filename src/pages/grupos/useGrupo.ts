import { chavesGrupos, type GrupoDto, type GrupoRequest, gruposApi, type TipoGrupo } from "@/api/grupos";
import { useFormularioCadastro } from "@/components/cadastros";
import { formatarCnpj, somenteDigitos } from "@/lib/documentos";

export interface FormGrupo {
  nome: string;
  tipo: TipoGrupo;
  cnpj: string;
  observacoes: string;
}

function paraForm(g: GrupoDto): FormGrupo {
  return {
    nome: g.nome,
    tipo: g.tipo,
    cnpj: g.tipo === "empresa" ? formatarCnpj(g.cnpj) : "",
    observacoes: g.observacoes ?? "",
  };
}

function paraRequest(f: FormGrupo, versao?: string): GrupoRequest {
  return {
    nome: f.nome,
    tipo: f.tipo,
    cnpj: f.tipo === "empresa" ? somenteDigitos(f.cnpj) || null : null,
    observacoes: f.observacoes || null,
    versao,
  };
}

/** Cadastro de grupo (família/empresa/outro): carrega por id, salva, trata 409/422 — ver useFormularioCadastro. */
export function useGrupo(id: string | undefined) {
  return useFormularioCadastro<FormGrupo, GrupoDto>({
    id,
    carregar: (id) => gruposApi.obter(id),
    chave: chavesGrupos.grupo,
    chaveLista: ["grupos", "lista"],
    paraForm,
    paraRequest,
    criar: (req) => gruposApi.criar(req as GrupoRequest),
    atualizar: (id, req) => gruposApi.atualizar(id, req as GrupoRequest),
    rotaDepoisDeCriar: (g) => `/clientes/grupos/${g.id}`,
    versaoDe: (g) => g.versao,
  });
}
