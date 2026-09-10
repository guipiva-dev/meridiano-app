import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { mensagemDeErro } from "@/api/errors";
import { chavesFornecedores, fornecedoresApi, type ListaFornecedorDto, resumoRegra } from "@/api/fornecedores";
import { useAuth } from "@/auth/useAuth";
import { Button, type Coluna, DataTable, Input, MoneyCell, Paginacao, Select } from "@/components";
import { Alert } from "@/components/display";
import { EmptyState } from "@/components/feedback";
import { Page, PageHeader } from "@/components/shell";
import { apresentacaoStatus } from "@/dominio/status";
import { formatarTelefone } from "@/lib/documentos";
import s from "./Fornecedores.module.css";

type Situacao = "ativos" | "inativos" | "todos";

const OPCOES_SITUACAO = [
  { value: "ativos", label: "Situação: ativos" },
  { value: "inativos", label: "Situação: inativos" },
  { value: "todos", label: "Situação: todos" },
];
const ATIVO_POR_SITUACAO: Record<Situacao, boolean | undefined> = {
  ativos: true,
  inativos: false,
  todos: undefined,
};

export function FornecedoresPage() {
  const nav = useNavigate();
  const { pode } = useAuth();
  const [q, setQ] = useState("");
  const [situacao, setSituacao] = useState<Situacao>("ativos");
  const [pagina, setPagina] = useState(1);
  const ativo = ATIVO_POR_SITUACAO[situacao];

  const listaQ = useQuery({
    queryKey: chavesFornecedores.resumo(q, ativo, pagina),
    queryFn: () => fornecedoresApi.resumo(q, ativo, pagina),
    placeholderData: keepPreviousData,
  });

  const itens = listaQ.data?.itens ?? [];
  const ano = listaQ.data?.ano;
  const mostrarReceita = itens[0]?.receitaAno !== undefined;

  const colunas = useMemo<Coluna<ListaFornecedorDto>[]>(() => {
    const base: Coluna<ListaFornecedorDto>[] = [
      {
        id: "fornecedor",
        titulo: "Fornecedor",
        render: (f) => (
          <div>
            <div className={s.primary}>{f.nome}</div>
            {f.telefoneEmergencia && (
              <div className={s.secondary}>plantão {formatarTelefone(f.telefoneEmergencia)}</div>
            )}
          </div>
        ),
      },
      { id: "tipo", titulo: "Tipo", render: (f) => apresentacaoStatus("fornecedor_tipo", f.tipo).texto },
      {
        id: "comissao",
        titulo: "Comissão padrão",
        alinhar: "right",
        render: (f) => (f.percentualComissaoPadrao === null ? "—" : `${f.percentualComissaoPadrao} %`),
      },
      {
        id: "pagamento",
        titulo: "Pagamento",
        render: (f) => resumoRegra(f.janelasVigentes, f.prazoComissaoDias),
      },
      { id: "reservas", titulo: "Reservas", alinhar: "right", render: (f) => f.reservas },
    ];
    if (!mostrarReceita) return base;
    return [
      ...base,
      {
        id: "receita",
        titulo: `Receita ${ano ?? ""}`.trim(),
        alinhar: "right",
        render: (f) => <MoneyCell value={f.receitaAno} emphasis="result" />,
      },
    ];
  }, [mostrarReceita, ano]);

  return (
    <Page>
      <PageHeader
        title="Fornecedores"
        subtitle={`${listaQ.data?.total ?? 0} cadastrados · a regra de pagamento define quando a comissão é esperada`}
        actions={
          pode("fornecedor.editar") && (
            <Button
              variant="primary"
              icon={<Plus size={20} />}
              onClick={() => {
                void nav("/fornecedores/nova");
              }}
            >
              + Novo fornecedor
            </Button>
          )
        }
      />

      <div className={s.filtros}>
        <Input
          type="search"
          placeholder="Buscar por nome ou CNPJ"
          aria-label="Buscar fornecedor"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPagina(1);
          }}
        />
        <Select
          className={s.situacao}
          aria-label="Situação"
          options={OPCOES_SITUACAO}
          value={situacao}
          onChange={(e) => {
            setSituacao(e.target.value as Situacao);
            setPagina(1);
          }}
        />
      </div>

      {listaQ.isError ? (
        <Alert
          tone="danger"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void listaQ.refetch();
              }}
            >
              Tentar de novo
            </Button>
          }
        >
          {mensagemDeErro(listaQ.error)}
        </Alert>
      ) : (
        <DataTable
          legenda="Fornecedores"
          colunas={colunas}
          linhas={itens}
          chave={(f) => f.id}
          carregando={listaQ.isLoading}
          onLinha={(f) => {
            void nav(`/fornecedores/${f.id}`);
          }}
          rotuloLinha={(f) => f.nome}
          vazio={
            <EmptyState
              title="Nenhum fornecedor por aqui"
              description="Nada bate com a busca. Limpe os filtros ou cadastre o primeiro fornecedor."
            />
          }
          rodape={
            <Paginacao
              pagina={pagina}
              tamanho={listaQ.data?.tamanho ?? 25}
              total={listaQ.data?.total ?? 0}
              onPagina={setPagina}
            />
          }
        />
      )}
    </Page>
  );
}
