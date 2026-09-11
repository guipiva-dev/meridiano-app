import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router";
import { type ClienteDto, type ClienteRequest, chavesClientes, clientesApi } from "@/api/clientes";
import { chavesGrupos, gruposApi } from "@/api/grupos";
import { chaves, viagensApi } from "@/api/viagens";
import { useFormularioCadastro } from "@/components/cadastros";
import { formatarCpf, somenteDigitos } from "@/lib/documentos";

export interface FormPessoa {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  whatsapp: string;
  dataNascimento: string;
  cidade: string;
  uf: string;
  origemLead: string;
  tags: string[];
  observacoes: string;
  contatoEmergencia: string;
  grupoId: string;
}

const VAZIO: FormPessoa = {
  nome: "",
  cpf: "",
  email: "",
  telefone: "",
  whatsapp: "",
  dataNascimento: "",
  cidade: "",
  uf: "",
  origemLead: "",
  tags: [],
  observacoes: "",
  contatoEmergencia: "",
  grupoId: "",
};

function paraForm(c: ClienteDto): FormPessoa {
  return {
    nome: c.nome,
    // Sem `cliente.ver_documento` o DTO nem traz `cpf`; o campo some do formulário.
    cpf: formatarCpf(c.cpf),
    email: c.email ?? "",
    telefone: c.telefone ?? "",
    whatsapp: c.whatsapp ?? "",
    dataNascimento: c.dataNascimento ?? "",
    cidade: c.cidade ?? "",
    uf: c.uf ?? "",
    origemLead: c.origemLead ?? "",
    tags: c.tags,
    observacoes: c.observacoes ?? "",
    contatoEmergencia: c.contatoEmergencia ?? "",
    grupoId: c.grupoId ?? "",
  };
}

function paraRequest(f: FormPessoa, versao?: string): ClienteRequest {
  return {
    nome: f.nome,
    cpf: somenteDigitos(f.cpf) || null,
    email: f.email || null,
    telefone: f.telefone || null,
    whatsapp: f.whatsapp || null,
    dataNascimento: f.dataNascimento || null,
    cidade: f.cidade || null,
    uf: f.uf || null,
    origemLead: f.origemLead || null,
    tags: f.tags,
    observacoes: f.observacoes || null,
    contatoEmergencia: f.contatoEmergencia || null,
    grupoId: f.grupoId || null,
    versao,
  };
}

/** Cadastro de pessoa: formulário (carrega/salva/409/422), tab na URL e as consultas das abas. */
export function usePessoa(id: string | undefined) {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "dados";

  const setTab = useCallback(
    (t: string) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (t === "dados") p.delete("tab");
          else p.set("tab", t);
          return p;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const base = useFormularioCadastro<FormPessoa, ClienteDto>({
    id,
    carregar: (i) => clientesApi.obter(i),
    chave: chavesClientes.cliente,
    chaveLista: ["clientes", "lista"],
    paraForm,
    paraRequest,
    criar: (req) => clientesApi.criar(req as ClienteRequest),
    atualizar: (i, req) => clientesApi.atualizar(i, req as ClienteRequest),
    rotaDepoisDeCriar: (c) => `/clientes/${c.id}`,
    versaoDe: (c) => c.versao,
  });

  // "Nova pessoa" não tem DTO para o `reset` do formulário base: sem isto `tags` nasceria undefined.
  const { form } = base;
  useEffect(() => {
    if (!id) form.reset(VAZIO);
  }, [id, form]);

  const daPessoa = Boolean(id);
  const alvo = id ?? "";
  const gruposQ = useQuery({ queryKey: chavesGrupos.lista("", 1), queryFn: () => gruposApi.listar("", 1) });
  const vendedoresQ = useQuery({ queryKey: chaves.vendedores, queryFn: viagensApi.vendedores });
  const viagensQ = useQuery({
    queryKey: chavesClientes.viagens(alvo),
    queryFn: () => clientesApi.viagens(alvo),
    enabled: daPessoa,
  });
  // Documentos NÃO são buscados aqui: `GET /clientes/{id}/documentos` grava `log_acesso_documento`
  // (LGPD) por linha devolvida. Só a aba Documentos, quando aberta, busca — por isso ela não tem contador.
  const pendenciasQ = useQuery({
    queryKey: chavesClientes.pendencias(alvo, false),
    queryFn: () => clientesApi.pendencias(alvo, false),
    enabled: daPessoa,
  });
  const atendimentosQ = useQuery({
    queryKey: chavesClientes.atendimentos(alvo),
    queryFn: () => clientesApi.atendimentos(alvo),
    enabled: daPessoa,
  });
  return {
    ...base,
    tab,
    setTab,
    grupos: gruposQ.data?.itens ?? [],
    vendedores: vendedoresQ.data ?? [],
    viagens: viagensQ.data ?? [],
    pendenciasAbertas: (pendenciasQ.data ?? []).filter((p) => p.status === "aberta").length,
    atendimentos: atendimentosQ.data?.length ?? 0,
  };
}
