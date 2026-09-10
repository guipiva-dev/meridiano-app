import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { mensagemDeErro } from "@/api/errors";
import type { PeriodoDto } from "@/api/fechamento";
import { chavesFechamento, fechamentoApi } from "@/api/fechamento";
import { useAuth } from "@/auth/useAuth";
import { Button, Select } from "@/components";
import { Alert } from "@/components/display";
import { FecharPeriodoModal, ReabrirModal } from "@/components/financeiro";
import { Page, PageHeader, Subnav } from "@/components/shell";
import { subnavs } from "@/shell/navegacao";
import s from "./Fechamento.module.css";
import { LinhaMes } from "./LinhaMes";

/** Ano atual e os dois anteriores, para o Select de ano do bloco. */
function anosDisponiveis(): number[] {
  const atual = new Date().getFullYear();
  return [atual, atual - 1, atual - 2];
}

export function FechamentoPage() {
  const { pode } = useAuth();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [periodoFechar, setPeriodoFechar] = useState<PeriodoDto | null>(null);
  const [periodoReabrir, setPeriodoReabrir] = useState<PeriodoDto | null>(null);

  const ano = Number(searchParams.get("ano")) || new Date().getFullYear();
  const podeFechar = pode("financeiro.fechar_periodo");
  const podeReabrir = pode("financeiro.editar_periodo_fechado");

  const listaQ = useQuery({
    queryKey: chavesFechamento.periodos(ano),
    queryFn: () => fechamentoApi.periodos(ano),
  });

  const pendentesQ = useQuery({
    queryKey: chavesFechamento.pendentes(periodoFechar?.competencia ?? ""),
    queryFn: () => fechamentoApi.pendentes(periodoFechar?.competencia ?? ""),
    enabled: periodoFechar !== null,
  });

  const periodos = [...(listaQ.data ?? [])].sort((a, b) => b.competencia.localeCompare(a.competencia));

  function invalidar() {
    void qc.invalidateQueries({ queryKey: chavesFechamento.periodos(ano) });
    void qc.invalidateQueries({ queryKey: ["conciliacao"] });
  }

  return (
    <Page>
      <PageHeader
        title="Fechamento de período"
        subtitle="Mês fechado congela tudo com competência nele: reservas, recebimentos, movimentos, despesas e repasses. Exceção só com permissão + motivo (vai para a auditoria)."
      />
      <Subnav items={subnavs["/financeiro"] ?? []} />

      <div className={s.bloco}>
        <div className={s.cabecalho}>
          <h2 className={s.titulo}>{ano}</h2>
          <span className={s.meta}>competência = mês da compra (comercial) e do recebimento (financeiro)</span>
          <Select
            aria-label="Ano"
            className={s.selectAno}
            value={String(ano)}
            options={anosDisponiveis().map((a) => ({ value: String(a), label: String(a) }))}
            onChange={(e) => {
              setSearchParams((prev) => {
                const proximos = new URLSearchParams(prev);
                proximos.set("ano", e.target.value);
                return proximos;
              });
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
          <div className={s.lista}>
            {periodos.map((p) => (
              <LinhaMes
                key={p.competencia}
                periodo={p}
                podeFechar={podeFechar}
                podeReabrir={podeReabrir}
                onFechar={() => {
                  setPeriodoFechar(p);
                }}
                onReabrir={() => {
                  setPeriodoReabrir(p);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Os modais semeiam o estado das props na montagem: montar só quando prontos mantém o form fresco. */}
      {periodoFechar && pendentesQ.data && (
        <FecharPeriodoModal
          open
          periodo={periodoFechar}
          pendentes={pendentesQ.data}
          onClose={() => {
            setPeriodoFechar(null);
          }}
          onFechado={() => {
            invalidar();
            setPeriodoFechar(null);
          }}
        />
      )}
      {periodoReabrir && (
        <ReabrirModal
          open
          periodo={periodoReabrir}
          onClose={() => {
            setPeriodoReabrir(null);
          }}
          onReaberto={() => {
            invalidar();
            setPeriodoReabrir(null);
          }}
        />
      )}
    </Page>
  );
}
