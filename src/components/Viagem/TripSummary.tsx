import { CircleHelp } from "lucide-react";
import type { ReactNode } from "react";
import { MoneyValue } from "@/components";
import { Tooltip } from "@/components/display";
import { arredondar2, calcularReserva } from "@/dominio/calculoReserva";
import { cx } from "@/lib/cx";
import s from "./Viagem.module.css";

export interface ReservaValores {
  valorTotal: number | null;
  valorComissao: number | null;
  ravOperadora: number | null;
  valorCliente: number | null;
  taxaServico: number | null;
  ravClienteModo: "retido_agencia" | "via_operadora";
  /** Cancelada fica fora dos totais, como no Resumo do detalhe. */
  status?: string;
}

/** Comissão média % = Σ comissão ÷ Σ total das reservas ativas (ruling 2026-09-14); null sem total. */
export function comissaoMedia(
  reservas: { valorTotal?: number | null; valorComissao?: number | null; status?: string }[],
): number | null {
  let comissao = 0;
  let total = 0;
  for (const r of reservas) {
    if (r.status === "cancelada") continue;
    comissao += r.valorComissao ?? 0;
    total += r.valorTotal ?? 0;
  }
  return total > 0 ? arredondar2((100 * comissao) / total) : null;
}

export function somarReservas(reservas: ReservaValores[]): {
  vendaTotal: number;
  custo: number;
  receitaPrevista: number;
  /** comissão + RAV das reservas ativas com venda informada (base da comissão do vendedor). */
  totalComissao: number;
  comissaoMedia: number | null;
  /** true quando alguma reserva ativa ainda não tem venda ao cliente preenchida. */
  incompleta: boolean;
} {
  let vendaTotal = 0;
  let custo = 0;
  let receitaPrevista = 0;
  let totalComissao = 0;
  let incompleta = false;
  for (const r of reservas) {
    if (r.status === "cancelada") continue;
    const valorTotal = r.valorTotal ?? 0;
    custo += valorTotal;
    if (r.valorCliente === null) {
      incompleta = true;
      continue;
    }
    vendaTotal += r.valorCliente;
    const calc = calcularReserva({
      valorTotal,
      valorComissao: r.valorComissao ?? 0,
      ravOperadora: r.ravOperadora ?? 0,
      valorCliente: r.valorCliente,
      taxaServico: r.taxaServico ?? 0,
      viaOperadora: r.ravClienteModo === "via_operadora",
    });
    receitaPrevista += calc.receitaPrevista ?? 0;
    totalComissao += calc.totalComissao ?? 0;
  }
  return {
    vendaTotal: arredondar2(vendaTotal),
    custo: arredondar2(custo),
    receitaPrevista: arredondar2(receitaPrevista),
    totalComissao: arredondar2(totalComissao),
    comissaoMedia: comissaoMedia(reservas),
    incompleta,
  };
}

export function rotuloComissaoMedia(p: number): string {
  return `comissão média ${String(p).replace(".", ",")} %`;
}

interface TripSummaryProps {
  reservas: ReservaValores[];
  repasseValor: number | null;
  despesas: number;
  /** Sem `viagem.ver_resultado` (agente): só total cobrado, custo e receita da agência. */
  mostrarResultado?: boolean;
  /** Bloco da reserva aberta (título + ResultSummary), montado pela página. Ausente = dica "Abra uma reserva…". */
  detalheReserva?: ReactNode;
  /** Rodapé do painel (atalhos). */
  rodape?: ReactNode;
}

export function TripSummary({
  reservas,
  repasseValor,
  despesas,
  mostrarResultado = true,
  detalheReserva,
  rodape,
}: TripSummaryProps) {
  const { vendaTotal, custo, receitaPrevista, comissaoMedia: media, incompleta } = somarReservas(reservas);
  const resultado = arredondar2(receitaPrevista - (repasseValor ?? 0) - despesas);
  const primeiraIncompleta = reservas.findIndex((r) => r.status !== "cancelada" && r.valorCliente === null);
  return (
    <aside aria-label="Resumo da viagem" className={s.painel}>
      <section className={s.painelBloco}>
        <h2 className={s.painelTitulo}>Viagem</h2>
        <dl className={s.kpis}>
          <div className={s.kpi}>
            <dt>Total cobrado</dt>
            <dd>
              <MoneyValue value={vendaTotal} />
            </dd>
          </div>
          <div className={cx(s.kpi, s.soLargo)}>
            <dt>Custo das reservas</dt>
            <dd>
              <MoneyValue value={custo} />
            </dd>
          </div>
          <div className={s.kpi}>
            <dt>Receita da agência</dt>
            <dd>
              <MoneyValue value={receitaPrevista} />
              {media !== null && <small className={cx(s.kpiNota, s.soLargo)}>{rotuloComissaoMedia(media)}</small>}
            </dd>
          </div>
          {mostrarResultado && (
            <>
              <div className={cx(s.kpi, s.soLargo)}>
                <dt>Comissão do vendedor</dt>
                <dd>
                  <MoneyValue value={repasseValor} />
                </dd>
              </div>
              <div className={cx(s.kpi, s.soLargo)}>
                <dt>Despesas da viagem</dt>
                <dd>
                  <MoneyValue value={despesas} />
                </dd>
              </div>
              <div className={cx(s.kpi, s.resultado)}>
                <dt>
                  Resultado da viagem{" "}
                  <Tooltip text="Receita da agência − comissão do vendedor − despesas vinculadas">
                    <CircleHelp size={16} aria-hidden />
                  </Tooltip>
                </dt>
                <dd data-testid="resultado-viagem">
                  <MoneyValue value={incompleta ? null : resultado} emphasis="result" />
                </dd>
              </div>
              {incompleta && primeiraIncompleta >= 0 && (
                <p className={cx(s.kpiNota, s.soLargo)}>Preencha o total cobrado da Reserva {primeiraIncompleta + 1}</p>
              )}
            </>
          )}
        </dl>
      </section>
      <section className={cx(s.painelBloco, s.soLargo)}>
        {detalheReserva ?? <p className={s.kpiNota}>Abra uma reserva para ver o cálculo</p>}
      </section>
      {rodape && <div className={cx(s.painelRodape, s.soLargo)}>{rodape}</div>}
    </aside>
  );
}
