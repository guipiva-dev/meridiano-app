import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CircleHelp } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { mensagemDeErro } from "@/api/errors";
import { chavesRelatorios, relatoriosApi, urlCsv } from "@/api/relatorios";
import { Button, DataTable, KpiCard, MoneyCell, MoneyValue, Select } from "@/components";
import { Alert, Tooltip } from "@/components/display";
import { Skeleton } from "@/components/Skeleton/Skeleton";
import { Page, PageHeader, Section } from "@/components/shell";
import { formatarDinheiro } from "@/lib/dinheiro";
import { baixar } from "@/lib/download";
import { BarrasMensais } from "./BarrasMensais";
import s from "./Relatorios.module.css";
import { ServicosVendidos } from "./ServicosVendidos";

function pct1(v: number | null): string {
  if (v === null) return "—";
  return `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
}
function pctTeto(v: number): string {
  return `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} %`;
}

export function RelatoriosPage() {
  const [anoSelecionado, setAnoSelecionado] = useState<number | null>(null);
  const [vendedorId, setVendedorId] = useState<string | null>(null);

  const resumoQ = useQuery({
    queryKey: chavesRelatorios.resumo(anoSelecionado, vendedorId),
    queryFn: () => relatoriosApi.resumo(anoSelecionado, vendedorId),
    placeholderData: keepPreviousData,
  });

  const dto = resumoQ.data;
  const anoEfetivo = anoSelecionado ?? dto?.ano ?? new Date().getFullYear();
  const anoAnterior = anoEfetivo - 1;
  const internacional = dto?.nacionalInternacional.find((t) => t.tipo === "internacional");
  const nacional = dto?.nacionalInternacional.find((t) => t.tipo === "nacional");

  return (
    <Page>
      <PageHeader
        title="Relatórios"
        subtitle={dto ? `${dto.ano} até ${dto.ate} · "quanto realmente sobrou?"` : undefined}
        actions={
          <div className={s.acoes}>
            <Select
              aria-label="Ano"
              className={s.select}
              options={(dto?.anos ?? [anoEfetivo]).map((a) => ({ value: String(a), label: String(a) }))}
              value={String(anoEfetivo)}
              onChange={(e) => {
                setAnoSelecionado(Number(e.target.value));
              }}
            />
            <Select
              aria-label="Vendedor"
              className={s.select}
              placeholder="Vendedor: todos"
              options={(dto?.vendedores ?? []).map((v) => ({ value: v.id, label: v.nome }))}
              value={vendedorId ?? ""}
              onChange={(e) => {
                setVendedorId(e.target.value || null);
              }}
            />
            <Button
              variant="secondary"
              onClick={() => {
                baixar(urlCsv(anoEfetivo, vendedorId), `relatorio-${anoEfetivo}.csv`);
              }}
            >
              Exportar CSV
            </Button>
          </div>
        }
      />

      {resumoQ.isError ? (
        <Alert
          tone="danger"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void resumoQ.refetch();
              }}
            >
              Tentar de novo
            </Button>
          }
        >
          {mensagemDeErro(resumoQ.error)}
        </Alert>
      ) : !dto ? (
        <Skeleton lines={8} />
      ) : (
        <>
          <div className={s.kpis}>
            <KpiCard
              label="Venda no ano"
              value={formatarDinheiro(dto.kpis.vendaAno)}
              contexto={`${dto.kpis.reservas} reservas · ${dto.kpis.viagens} viagens`}
            />
            <KpiCard
              label="Receita recebida"
              value={formatarDinheiro(dto.kpis.receitaRecebida)}
              contexto={
                dto.kpis.recebidoDeAnosAnteriores > 0
                  ? `prevista ${formatarDinheiro(dto.kpis.receitaPrevista)} · inclui ${formatarDinheiro(dto.kpis.recebidoDeAnosAnteriores)} de ${anoAnterior}`
                  : `prevista ${formatarDinheiro(dto.kpis.receitaPrevista)}`
              }
            />
            <KpiCard
              label="Despesas pagas"
              value={formatarDinheiro(dto.kpis.despesasPagas)}
              contexto={
                vendedorId
                  ? "só despesas ligadas às viagens do vendedor"
                  : `fixas ${formatarDinheiro(dto.kpis.despesasFixas)} · viagens ${formatarDinheiro(dto.kpis.despesasViagens)}`
              }
            />
            <KpiCard
              label="Resultado operacional"
              value={<MoneyValue value={dto.kpis.resultadoOperacional} emphasis="result" />}
              contexto="receita recebida − despesas pagas"
            />
            <KpiCard
              label="Margem operacional"
              value={pct1(dto.kpis.margemOperacionalPct)}
              contexto={`resultado ÷ venda · comercial ${pct1(dto.kpis.margemComercialPct)}`}
            />
            {dto.tetoMei ? (
              <div className={s.tetoWrap}>
                <KpiCard
                  label={`Teto MEI ${dto.ano}`}
                  value={pctTeto(dto.tetoMei.percentualTeto)}
                  contexto={`${formatarDinheiro(dto.tetoMei.receitaAno)} de ${formatarDinheiro(dto.tetoMei.teto)} · alerta em 80 %${vendedorId ? " · valores da agência" : ""}`}
                  tone={dto.tetoMei.alerta ? "warning" : "normal"}
                />
                <span className={s.tetoTooltip}>
                  <Tooltip text="Receita recebida no ano (caixa) contra o teto configurado da agência">
                    <CircleHelp size={16} aria-hidden />
                  </Tooltip>
                </span>
              </div>
            ) : (
              <KpiCard label={`Teto MEI ${dto.ano}`} value="Sem movimentos no ano" />
            )}
          </div>

          <div className={s.linha}>
            <div className={s.bloco}>
              <Section title="Receita por mês" description="prevista (clara) e recebida (escura)">
                <BarrasMensais meses={dto.receitaPorMes} />
              </Section>
            </div>
            <div className={s.bloco}>
              <Section title="Nacional × internacional">
                <div className={s.horizontal}>
                  {internacional && (
                    <div>
                      <div className={s.horizontalCabecalho}>
                        <b>Internacional</b>
                        <span className={s.horizontalValor}>
                          {formatarDinheiro(internacional.venda)} · {pct1(internacional.pct)}
                        </span>
                      </div>
                      <div className={s.trilha}>
                        <span
                          className={`${s.preenchimento} ${s.internacional}`}
                          style={{ "--largura": internacional.pct } as CSSProperties}
                        />
                      </div>
                    </div>
                  )}
                  {nacional && (
                    <div>
                      <div className={s.horizontalCabecalho}>
                        <b>Nacional</b>
                        <span className={s.horizontalValor}>
                          {formatarDinheiro(nacional.venda)} · {pct1(nacional.pct)}
                        </span>
                      </div>
                      <div className={s.trilha}>
                        <span
                          className={`${s.preenchimento} ${s.nacional}`}
                          style={{ "--largura": nacional.pct } as CSSProperties}
                        />
                      </div>
                    </div>
                  )}
                  <span className={s.rodapeMargens}>
                    Margem: internacional {pct1(internacional?.margemPct ?? null)} · nacional{" "}
                    {pct1(nacional?.margemPct ?? null)}
                  </span>
                </div>
              </Section>
            </div>
          </div>

          <div className={s.linha2}>
            <div className={s.bloco}>
              <Section title="Fornecedores" description="por receita no ano">
                <DataTable
                  legenda="Fornecedores por receita no ano"
                  chave={(f) => f.fornecedorId}
                  linhas={dto.fornecedores}
                  colunas={[
                    { id: "nome", titulo: "Fornecedor", render: (f) => f.nome },
                    { id: "reservas", titulo: "Reservas", alinhar: "right", render: (f) => f.reservas },
                    { id: "volume", titulo: "Volume", alinhar: "right", render: (f) => <MoneyCell value={f.volume} /> },
                    {
                      id: "receita",
                      titulo: "Receita",
                      alinhar: "right",
                      render: (f) => <MoneyCell value={f.receita} emphasis="result" />,
                    },
                    { id: "margem", titulo: "Margem", alinhar: "right", render: (f) => pct1(f.margemPct) },
                  ]}
                  vazio="Nenhum fornecedor com reserva no ano."
                />
              </Section>
            </div>
            <ServicosVendidos servicos={dto.servicos} />
          </div>
        </>
      )}
    </Page>
  );
}
