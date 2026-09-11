import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { DespesaDto } from "@/api/despesas";
import { chavesDespesas, despesasApi } from "@/api/despesas";
import { mensagemDeErro } from "@/api/errors";
import { chaves, viagensApi } from "@/api/viagens";
import { useAuth } from "@/auth/useAuth";
import { Button, Input, KpiCard, Paginacao } from "@/components";
import { Alert } from "@/components/display";
import { toast } from "@/components/feedback";
import { DespesaModal, ExcluirDespesaModal, PagarDespesaModal } from "@/components/financeiro";
import { Page, PageHeader, Subnav } from "@/components/shell";
import { competenciaAtual, formatarData, hojeIso, nomeMes } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";
import { subnavs } from "@/shell/navegacao";
import s from "./Despesas.module.css";
import { FiltrosDespesas, TabelaDespesas } from "./TabelaDespesas";
import { useDespesas } from "./useDespesas";

const KPIS_VAZIOS = {
  lancadoValor: 0,
  lancadoQtd: 0,
  aPagarValor: 0,
  vencidas: 0,
  vencemAte7Dias: 0,
  fixosValor: 0,
  ligadasViagemValor: 0,
  ligadasViagemQtd: 0,
};

/** dd/mm de hoje + 7 dias, para o aviso do KPI "A pagar". */
function dataLimite7Dias(): string {
  const d = new Date(`${hojeIso()}T00:00:00`);
  d.setDate(d.getDate() + 7);
  return formatarData(d.toLocaleDateString("en-CA"));
}

export function DespesasPage() {
  const { pode } = useAuth();
  const { filtro, definir, modal, abrir, fechar, invalidar } = useDespesas();
  const mes = filtro.mes ?? competenciaAtual();
  const fornecedoresQ = useQuery({ queryKey: chaves.fornecedores, queryFn: viagensApi.fornecedores });
  const listaQ = useQuery({
    queryKey: chavesDespesas.lista(filtro),
    queryFn: () => despesasApi.listar(filtro),
    placeholderData: keepPreviousData,
  });

  const itens = listaQ.data?.itens ?? [];
  const kpis = listaQ.data?.kpis ?? KPIS_VAZIOS;
  const podeMovimentar = pode("financeiro.movimentar");

  function aoPagar(_despesa: DespesaDto, proxima: DespesaDto | null) {
    toast.success(proxima ? `Paga. Próxima criada para ${formatarData(proxima.vencimento)}` : "Paga");
    invalidar();
  }

  return (
    <Page>
      <PageHeader
        title="Despesas"
        subtitle={`Gastos da agência · ${nomeMes(mes)} · ${formatarDinheiro(kpis.lancadoValor)} lançados · ${formatarDinheiro(kpis.aPagarValor)} a pagar`}
        actions={
          <>
            <Input
              type="month"
              aria-label="Mês"
              value={mes}
              onChange={(e) => {
                definir({ mes: e.target.value || undefined });
              }}
            />
            {podeMovimentar && (
              <Button
                variant="primary"
                onClick={() => {
                  abrir({ tipo: "nova" });
                }}
              >
                + Nova despesa
              </Button>
            )}
          </>
        }
      />
      <Subnav items={subnavs["/financeiro"] ?? []} />

      <div className={s.kpis}>
        <KpiCard
          label="Lançado no mês"
          value={formatarDinheiro(kpis.lancadoValor)}
          contexto={`${kpis.lancadoQtd} despesas`}
        />
        <KpiCard
          label="A pagar"
          value={formatarDinheiro(kpis.aPagarValor)}
          tone={kpis.vencidas > 0 ? "warning" : "normal"}
          actionLabel={`${kpis.vencidas} vencida(s) · ${kpis.vencemAte7Dias} vencem até ${dataLimite7Dias()} →`}
          onAction={() => {
            definir({ situacao: "vencida" });
          }}
        />
        <KpiCard label="Fixos" value={formatarDinheiro(kpis.fixosValor)} contexto="DAS, sistema, telefone" />
        <KpiCard
          label="Ligadas a viagens"
          value={formatarDinheiro(kpis.ligadasViagemValor)}
          contexto={`${kpis.ligadasViagemQtd} despesa(s) · entra no resultado da viagem`}
        />
      </div>

      <FiltrosDespesas
        categoria={filtro.categoria}
        situacao={filtro.situacao}
        soVinculadas={filtro.soVinculadas}
        definir={definir}
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
          <TabelaDespesas
            itens={itens}
            carregando={listaQ.isLoading}
            podeMovimentar={podeMovimentar}
            mes={mes}
            onPagar={(d) => {
              abrir({ tipo: "pagar", despesa: d });
            }}
            onEditar={(d) => {
              abrir({ tipo: "editar", despesa: d });
            }}
            onExcluir={(d) => {
              abrir({ tipo: "excluir", despesa: d });
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

      {/* Os modais semeiam o estado das props na montagem: montar só quando abertos mantém o form fresco. */}
      {modal?.tipo === "nova" && (
        <DespesaModal open fornecedores={fornecedoresQ.data ?? []} onClose={fechar} onSalva={invalidar} />
      )}
      {modal?.tipo === "editar" && (
        <DespesaModal
          open
          despesa={modal.despesa}
          fornecedores={fornecedoresQ.data ?? []}
          onClose={fechar}
          onSalva={invalidar}
        />
      )}
      {modal?.tipo === "pagar" && <PagarDespesaModal open despesa={modal.despesa} onClose={fechar} onPaga={aoPagar} />}
      {modal?.tipo === "excluir" && (
        <ExcluirDespesaModal open despesa={modal.despesa} onClose={fechar} onExcluida={invalidar} />
      )}
    </Page>
  );
}
