import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { mensagemDeErro } from "@/api/errors";
import type { RepasseItemDto, VendedorRepassesDto } from "@/api/repasses";
import { chavesRepasses, repassesApi } from "@/api/repasses";
import { useAuth } from "@/auth/useAuth";
import { Button, Input, KpiCard } from "@/components";
import { Alert } from "@/components/display";
import { EmptyState } from "@/components/feedback";
import { PagarRepasseModal } from "@/components/financeiro";
import { Page, PageHeader, Subnav } from "@/components/shell";
import { competenciaAtual, nomeMes } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";
import { subnavs } from "@/shell/navegacao";
import s from "./Repasses.module.css";
import { VendedorCard } from "./VendedorCard";

interface ModalPagar {
  vendedor: VendedorRepassesDto;
  itens: RepasseItemDto[];
}

/** Rola até o card do vendedor (KPIs "→"); vendedor pode não existir se não houver nenhum. */
function scrollParaVendedor(usuarioId: string | undefined) {
  if (!usuarioId) return;
  document.getElementById(`vendedor-${usuarioId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function RepassesPage() {
  const { pode } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();
  const [modal, setModal] = useState<ModalPagar | null>(null);

  const pagos = searchParams.get("pagos");
  const historico = pagos !== null;
  const podePagar = pode("repasse.pagar");

  const listaQ = useQuery({
    queryKey: chavesRepasses.lista(pagos ?? undefined),
    queryFn: () => repassesApi.listar(pagos ?? undefined),
  });

  const vendedores = listaQ.data?.vendedores ?? [];
  const kpis = listaQ.data?.kpis;
  const ano = listaQ.data?.ano ?? new Date().getFullYear();
  const primeiroAPagar = vendedores.find((v) => v.aPagarValor > 0)?.usuarioId;
  const primeiroSemValor = vendedores.find((v) => v.itens.some((i) => i.valor === null))?.usuarioId;

  function invalidar() {
    void qc.invalidateQueries({ queryKey: ["repasses"] });
  }

  return (
    <Page>
      <PageHeader
        title="Repasses a vendedores"
        subtitle="Liberado quando toda comissão da viagem entra · valor definido por você"
        actions={
          <div className={s.acoes}>
            {historico && (
              <Input
                type="month"
                aria-label="Mês"
                value={pagos}
                onChange={(e) => {
                  setSearchParams((prev) => {
                    const proximos = new URLSearchParams(prev);
                    proximos.set("pagos", e.target.value || competenciaAtual());
                    return proximos;
                  });
                }}
              />
            )}
            <Button
              variant="secondary"
              onClick={() => {
                setSearchParams((prev) => {
                  const proximos = new URLSearchParams(prev);
                  if (historico) proximos.delete("pagos");
                  else proximos.set("pagos", competenciaAtual());
                  return proximos;
                });
              }}
            >
              {historico ? "Voltar aos abertos" : "Histórico"}
            </Button>
          </div>
        }
      />
      <Subnav items={subnavs["/financeiro"] ?? []} />

      {!historico && kpis && (
        <div className={s.kpis}>
          <KpiCard
            label="A pagar agora"
            value={formatarDinheiro(kpis.aPagarValor)}
            actionLabel={`${kpis.aPagarVendedores} vendedores · ${kpis.aPagarViagens} viagens →`}
            onAction={() => {
              scrollParaVendedor(primeiroAPagar);
            }}
          />
          <KpiCard
            label="Bloqueado"
            value={formatarDinheiro(kpis.bloqueadoValor)}
            contexto={`aguardando comissão de ${kpis.bloqueadoViagens} viagens`}
          />
          <KpiCard
            label="Sem valor definido"
            value={String(kpis.semValor)}
            tone={kpis.semValor > 0 ? "warning" : "normal"}
            actionLabel="viagens esperando você informar →"
            onAction={() => {
              scrollParaVendedor(primeiroSemValor);
            }}
          />
        </div>
      )}

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
      ) : vendedores.length === 0 && !listaQ.isLoading ? (
        <EmptyState
          title={historico ? `Nenhum repasse pago em ${nomeMes(pagos)}` : "Nenhum repasse em aberto"}
          description={
            historico
              ? "Troque o mês ou volte aos abertos."
              : "Repasses aparecem quando uma viagem tem vendedor externo com repasse."
          }
        />
      ) : (
        <div className={s.grid}>
          {vendedores.map((vendedor) => (
            <VendedorCard
              key={vendedor.usuarioId}
              vendedor={vendedor}
              ano={ano}
              historico={historico}
              podePagar={podePagar}
              onPagar={(itens) => {
                setModal({ vendedor, itens });
              }}
              onValorSalvo={invalidar}
            />
          ))}
        </div>
      )}

      {modal && (
        <PagarRepasseModal
          key={modal.vendedor.usuarioId}
          open
          vendedor={modal.vendedor}
          itens={modal.itens}
          onClose={() => {
            setModal(null);
          }}
          onPagos={() => {
            invalidar();
            setModal(null);
          }}
        />
      )}
    </Page>
  );
}
