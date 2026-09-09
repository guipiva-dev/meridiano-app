import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router";
import { mensagemDeErro } from "@/api/errors";
import {
  type AbaViagens,
  type ContadoresDto,
  chaves,
  type FiltroViagens,
  type ListaViagemDto,
  viagensApi,
} from "@/api/viagens";
import { useAuth } from "@/auth/useAuth";
import { Button, type Coluna, DataTable, DateCell, MoneyCell, Paginacao, StatusCell } from "@/components";
import { Alert } from "@/components/display";
import { EmptyState } from "@/components/feedback";
import { Page, PageHeader, Subnav, Tabs } from "@/components/shell";
import { subnavs } from "@/shell/navegacao";
import { FiltrosViagens } from "./FiltrosViagens";
import { useFiltrosViagens } from "./useFiltrosViagens";
import s from "./ViagensPage.module.css";

const ROTULO_TIPO: Record<ListaViagemDto["tipo"], string> = { nacional: "Nacional", internacional: "Internacional" };

const TABS: { id: AbaViagens; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "em_emissao", label: "Em emissão" },
  { id: "embarcam_semana", label: "Embarcam esta semana" },
  { id: "comissao_atrasada", label: "Comissão atrasada" },
  { id: "concluidas", label: "Concluídas" },
];
const CAMPO_CONTADOR: Record<AbaViagens, keyof ContadoresDto> = {
  todas: "todas",
  em_emissao: "emEmissao",
  embarcam_semana: "embarcamSemana",
  comissao_atrasada: "comissaoAtrasada",
  concluidas: "concluidas",
};
const CONTADORES_VAZIOS: ContadoresDto = {
  todas: 0,
  emEmissao: 0,
  embarcamSemana: 0,
  comissaoAtrasada: 0,
  concluidas: 0,
};

export function ViagensPage() {
  const nav = useNavigate();
  const { pode } = useAuth();
  const { filtro, idaPreset, definir, limpar, ativos } = useFiltrosViagens();
  const vendedoresQ = useQuery({ queryKey: chaves.vendedores, queryFn: viagensApi.vendedores });
  const fornecedoresQ = useQuery({ queryKey: chaves.fornecedores, queryFn: viagensApi.fornecedores });
  const listaQ = useQuery({
    queryKey: chaves.viagens(filtro),
    queryFn: () => viagensApi.listar(filtro),
    placeholderData: keepPreviousData,
  });

  const itens = listaQ.data?.itens ?? [];
  const contadores = listaQ.data?.contadores ?? CONTADORES_VAZIOS;
  const mostrarValores = itens[0]?.vendaTotal !== undefined;

  const colunas = useMemo<Coluna<ListaViagemDto>[]>(() => {
    const base: Coluna<ListaViagemDto>[] = [
      {
        id: "viagem",
        titulo: "Viagem",
        render: (l) => (
          <div>
            <div className={s.primary}>{l.titular}</div>
            <div className={s.secondary}>
              {l.destino} · {ROTULO_TIPO[l.tipo]} · <code>{l.codigo}</code>
            </div>
          </div>
        ),
      },
      { id: "ida", titulo: "Ida", ordenavel: true, render: (l) => <DateCell value={l.dataIda} /> },
      { id: "vendedor", titulo: "Vendedor", render: (l) => l.vendedorNome },
      { id: "fase", titulo: "Fase", render: (l) => <StatusCell entidade="fase_viagem" valor={l.faseOperacional} /> },
      {
        id: "financeiro",
        titulo: "Financeiro",
        render: (l) => <StatusCell entidade="comissao" valor={l.faseFinanceira} />,
      },
    ];
    if (!mostrarValores) return base;
    return [
      ...base,
      {
        id: "venda",
        titulo: "Venda",
        alinhar: "right",
        ordenavel: true,
        render: (l) => <MoneyCell value={l.vendaTotal} />,
      },
      {
        id: "receita",
        titulo: "Receita",
        alinhar: "right",
        render: (l) => <MoneyCell value={l.receitaPrevista} emphasis="result" />,
      },
    ];
  }, [mostrarValores]);

  return (
    <Page>
      <PageHeader
        title="Viagens"
        subtitle={`${contadores.todas} viagens · ${contadores.emEmissao} em emissão · ${contadores.comissaoAtrasada} com comissão atrasada`}
        actions={
          pode("viagem.criar") && (
            <Button
              variant="business"
              icon={<Plus size={20} />}
              onClick={() => {
                void nav("/viagens/nova");
              }}
            >
              + Nova viagem
            </Button>
          )
        }
      />
      <Subnav items={subnavs["/viagens"] ?? []} />

      <Tabs
        tabs={TABS.map((t) => ({ id: t.id, label: t.label, count: contadores[CAMPO_CONTADOR[t.id]] }))}
        active={filtro.aba ?? "todas"}
        onChange={(id) => {
          definir({ aba: id as AbaViagens });
        }}
      >
        <Tabs.Panel id={filtro.aba ?? "todas"} active={filtro.aba ?? "todas"}>
          <FiltrosViagens
            filtro={filtro}
            idaPreset={idaPreset}
            definir={definir}
            limpar={limpar}
            ativos={ativos}
            vendedores={vendedoresQ.data ?? []}
            fornecedores={fornecedoresQ.data ?? []}
          />

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
              legenda="Viagens"
              colunas={colunas}
              linhas={itens}
              chave={(l) => l.id}
              carregando={listaQ.isLoading}
              onLinha={(l) => {
                void nav(`/viagens/${l.id}`);
              }}
              rotuloLinha={(l) => `${l.titular} · ${l.destino} · ${l.codigo}`}
              ordenacao={{ campo: filtro.ordem ?? "ida", direcao: filtro.direcao ?? "desc" }}
              onOrdenar={(o) => {
                definir({ ordem: o.campo as FiltroViagens["ordem"], direcao: o.direcao });
              }}
              vazio={
                <EmptyState
                  title="Nenhuma viagem por aqui"
                  description="Nada bate com os filtros. Limpe os filtros ou lance a primeira viagem."
                  action={
                    <Button variant="secondary" onClick={limpar}>
                      Limpar filtros
                    </Button>
                  }
                />
              }
              rodape={
                <Paginacao
                  pagina={filtro.pagina ?? 1}
                  tamanho={filtro.tamanho ?? 25}
                  total={listaQ.data?.total ?? 0}
                  onPagina={(p) => {
                    definir({ pagina: p });
                  }}
                />
              }
            />
          )}
        </Tabs.Panel>
      </Tabs>
    </Page>
  );
}
