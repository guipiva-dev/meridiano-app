import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { mensagemDeErro } from "@/api/errors";
import { type AbaConciliacao, chavesFinanceiro, financeiroApi } from "@/api/financeiro";
import { chaves, viagensApi } from "@/api/viagens";
import { useAuth } from "@/auth/useAuth";
import { Button, KpiCard, Paginacao } from "@/components";
import { Alert } from "@/components/display";
import { DivergenciaModal, ReceberLoteModal, ReceberModal } from "@/components/financeiro";
import { Page, PageHeader, Subnav, Tabs } from "@/components/shell";
import { nomeMes, somarMeses } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";
import { subnavs } from "@/shell/navegacao";
import s from "./Conciliacao.module.css";
import { FiltrosConciliacao } from "./FiltrosConciliacao";
import { TabelaConciliacao } from "./TabelaConciliacao";
import { useConciliacao } from "./useConciliacao";

const KPIS_VAZIOS = {
  aReceber: { valor: 0, reservas: 0, extra: null },
  atrasadas: { valor: 0, reservas: 0, extra: null },
  vencemSemana: { valor: 0, reservas: 0, extra: null },
  recebidoMes: { valor: 0, variacaoPercentual: null },
};

/** "2026-03" → "março" (rótulo da aba Recebidas; `nomeMes` traz "Março de 2026"). */
function mesCurto(competencia: string): string {
  return (nomeMes(competencia).split(" de ")[0] ?? "").toLowerCase();
}

function contextoRecebido(variacao: number | null, mes: string): string {
  if (variacao === null) return "— sem base";
  return `${variacao >= 0 ? "▲" : "▼"} ${Math.abs(variacao)} % vs ${mesCurto(somarMeses(mes, -1))}`;
}

export function ConciliacaoPage() {
  const { pode } = useAuth();
  const { filtro, definir, selecionados, alternar, modal, abrir, fechar, aplicarMovimento } = useConciliacao();
  const fornecedoresQ = useQuery({ queryKey: chaves.fornecedores, queryFn: viagensApi.fornecedores });
  const listaQ = useQuery({
    queryKey: chavesFinanceiro.conciliacao(filtro),
    queryFn: () => financeiroApi.conciliacao(filtro),
    placeholderData: keepPreviousData,
  });

  const aba = filtro.aba ?? "pendentes";
  const mes = listaQ.data?.mes ?? filtro.mes ?? "";
  const itens = listaQ.data?.itens ?? [];
  const contadores = listaQ.data?.contadores;
  const kpis = listaQ.data?.kpis ?? KPIS_VAZIOS;
  const podeMovimentar = pode("financeiro.movimentar");
  const podeConciliar = pode("financeiro.conciliar");
  const comLote = podeConciliar && (aba === "pendentes" || aba === "atrasadas");
  const escolhidos = itens.filter((i) => selecionados.has(i.reservaId));
  const soma = escolhidos.reduce((total, i) => total + i.saldo, 0);

  return (
    <Page>
      <PageHeader title="Comissões a receber" subtitle="O que as operadoras ainda devem à agência" />
      <Subnav items={subnavs["/financeiro"] ?? []} />

      <div className={s.kpis}>
        <KpiCard
          label="A receber"
          value={formatarDinheiro(kpis.aReceber.valor)}
          contexto={`${kpis.aReceber.reservas} reservas · ${kpis.aReceber.extra ?? 0} operadoras`}
        />
        <KpiCard
          label="Atrasadas"
          value={formatarDinheiro(kpis.atrasadas.valor)}
          tone={kpis.atrasadas.reservas > 0 ? "danger" : "normal"}
          actionLabel={`${kpis.atrasadas.reservas} reservas · pior: ${kpis.atrasadas.extra ?? 0} dias →`}
          onAction={() => {
            definir({ aba: "atrasadas" });
          }}
        />
        <KpiCard
          label="Vencem esta semana"
          value={formatarDinheiro(kpis.vencemSemana.valor)}
          actionLabel={`${kpis.vencemSemana.reservas} reservas →`}
          onAction={() => {
            definir({ aba: "pendentes", previsto: "semana" });
          }}
        />
        <KpiCard
          label="Recebido no mês"
          value={formatarDinheiro(kpis.recebidoMes.valor)}
          contexto={contextoRecebido(kpis.recebidoMes.variacaoPercentual, mes)}
        />
      </div>

      <Tabs
        tabs={[
          { id: "pendentes", label: "Pendentes", count: contadores?.pendentes ?? 0 },
          { id: "atrasadas", label: "Atrasadas", count: contadores?.atrasadas ?? 0 },
          { id: "recebidas", label: `Recebidas em ${mesCurto(mes)}`, count: contadores?.recebidasMes ?? 0 },
          { id: "divergencias", label: "Divergências", count: contadores?.divergencias ?? 0 },
        ]}
        active={aba}
        onChange={(id) => {
          definir({ aba: id as AbaConciliacao });
        }}
      >
        <Tabs.Panel id={aba} active={aba}>
          <FiltrosConciliacao
            filtro={filtro}
            aba={aba}
            definir={definir}
            fornecedores={fornecedoresQ.data ?? []}
            lote={
              comLote
                ? {
                    quantidade: escolhidos.length,
                    soma,
                    onAbrir: () => {
                      abrir({ tipo: "lote" });
                    },
                  }
                : null
            }
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
            <>
              <TabelaConciliacao
                itens={itens}
                aba={aba}
                carregando={listaQ.isLoading}
                selecionados={selecionados}
                alternar={alternar}
                podeMovimentar={podeMovimentar}
                podeConciliar={podeConciliar}
                onReceber={(item) => {
                  abrir({ tipo: "receber", item });
                }}
                onDivergencia={(item) => {
                  abrir({ tipo: "divergencia", item });
                }}
              />
              <Paginacao
                pagina={filtro.pagina ?? 1}
                tamanho={listaQ.data?.tamanho ?? 25}
                total={listaQ.data?.total ?? 0}
                onPagina={(p) => {
                  definir({ pagina: p });
                }}
              />
            </>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Os modais semeiam o estado das props na montagem: montar só quando abertos mantém o form fresco. */}
      {modal?.tipo === "receber" && (
        <ReceberModal open item={modal.item} onClose={fechar} onRecebido={aplicarMovimento} />
      )}
      {modal?.tipo === "divergencia" && (
        <DivergenciaModal open item={modal.item} onClose={fechar} onEncerrada={aplicarMovimento} />
      )}
      {modal?.tipo === "lote" && (
        <ReceberLoteModal open itens={escolhidos} onClose={fechar} onRecebido={aplicarMovimento} />
      )}
    </Page>
  );
}
