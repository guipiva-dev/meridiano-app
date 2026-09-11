import { useSearchParams } from "react-router";
import {
  chavesFornecedores,
  type FornecedorDetalheDto,
  type FornecedorRequest,
  fornecedoresApi,
  type TipoFornecedor,
} from "@/api/fornecedores";
import { useFormularioCadastro } from "@/components/cadastros";

/** Tudo texto: o form espelha os inputs; a conversão para o request acontece em `paraRequest`. */
export interface FormFornecedor {
  nome: string;
  tipo: TipoFornecedor;
  cnpj: string;
  site: string;
  contato: string;
  telefone: string;
  telefoneEmergencia: string;
  percentualComissaoPadrao: string;
  prazoComissaoDias: string;
  ativo: string;
  observacoes: string;
}

function texto(v: string | undefined): string | null {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
}

function numero(v: string | undefined): number | null {
  const t = (v ?? "").trim();
  return t === "" ? null : Number(t);
}

function paraForm(d: FornecedorDetalheDto): FormFornecedor {
  return {
    nome: d.nome,
    tipo: d.tipo,
    cnpj: d.cnpj ?? "",
    site: d.site ?? "",
    contato: d.contato ?? "",
    telefone: d.telefone ?? "",
    telefoneEmergencia: d.telefoneEmergencia ?? "",
    percentualComissaoPadrao: d.percentualComissaoPadrao === null ? "" : String(d.percentualComissaoPadrao),
    prazoComissaoDias: d.prazoComissaoDias === null ? "" : String(d.prazoComissaoDias),
    ativo: d.ativo ? "true" : "false",
    observacoes: d.observacoes ?? "",
  };
}

/** `Partial`: na tela de criação não há `reset`, então campo intocado chega `undefined` do react-hook-form. */
function paraRequest(f: Partial<FormFornecedor>, versao?: string): FornecedorRequest {
  return {
    nome: (f.nome ?? "").trim(),
    // Sem `reset` os selects ficam no primeiro option até alguém mexer.
    tipo: f.tipo ?? "operadora",
    cnpj: texto(f.cnpj),
    site: texto(f.site),
    contato: texto(f.contato),
    telefone: texto(f.telefone),
    telefoneEmergencia: texto(f.telefoneEmergencia),
    percentualComissaoPadrao: numero(f.percentualComissaoPadrao),
    prazoComissaoDias: numero(f.prazoComissaoDias),
    ativo: f.ativo !== "false",
    observacoes: texto(f.observacoes),
    versao,
  };
}

/** O POST devolve o `FornecedorDto` enxuto da 3.2; completa o detalhe até o GET da rota nova chegar. */
async function criar(req: unknown): Promise<FornecedorDetalheDto> {
  const enviado = req as FornecedorRequest;
  const criado = await fornecedoresApi.criar(enviado);
  return {
    ...enviado,
    id: criado.id,
    versao: "",
    nome: criado.nome,
    tipo: criado.tipo as TipoFornecedor,
    ativo: criado.ativo,
    percentualComissaoPadrao: criado.percentualComissaoPadrao,
    prazoComissaoDias: criado.prazoComissaoDias,
    resumo: { reservas: 0 },
    regras: [],
    regraVigente: null,
  };
}

/** Estado da página de fornecedor: formulário de cadastro + aba na URL (`?tab=`). */
export function useFornecedor(id: string | undefined) {
  const [params, setParams] = useSearchParams();
  const cadastro = useFormularioCadastro<FormFornecedor, FornecedorDetalheDto>({
    id,
    carregar: fornecedoresApi.obter,
    chave: chavesFornecedores.fornecedor,
    chaveLista: ["fornecedores", "resumo"],
    paraForm,
    paraRequest: (f, versao) => paraRequest(f, versao),
    criar,
    atualizar: (idFornecedor, req) => fornecedoresApi.atualizar(idFornecedor, req as FornecedorRequest),
    rotaDepoisDeCriar: (f) => `/fornecedores/${f.id}`,
    versaoDe: (d) => d.versao,
  });

  function setTab(t: string) {
    setParams(
      (prev) => {
        const proximos = new URLSearchParams(prev);
        if (t === "dados") proximos.delete("tab");
        else proximos.set("tab", t);
        return proximos;
      },
      { replace: true },
    );
  }

  return { ...cadastro, tab: params.get("tab") ?? "dados", setTab };
}
