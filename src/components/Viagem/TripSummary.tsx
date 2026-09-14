import { CircleHelp } from "lucide-react";
import { Button, MoneyValue } from "@/components";
import { Tooltip } from "@/components/display";
import { arredondar2, calcularReserva } from "@/dominio/calculoReserva";
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
  onAdicionarReserva: () => void;
  /** Sem `viagem.ver_resultado` (agente): só total cobrado, custo e receita da agência. */
  mostrarResultado?: boolean;
}

export function TripSummary({
  reservas,
  repasseValor,
  despesas,
  onAdicionarReserva,
  mostrarResultado = true,
}: TripSummaryProps) {
  const { vendaTotal, custo, receitaPrevista, comissaoMedia: media, incompleta } = somarReservas(reservas);
  const resultado = arredondar2(receitaPrevista - (repasseValor ?? 0) - despesas);
  return (
    <div className={s.summaryStrip}>
      <div className={s.item}>
        <small>Total cobrado</small>
        <MoneyValue value={vendaTotal} />
      </div>
      <span className={s.sep} aria-hidden />
      <div className={s.item}>
        <small>Custo das reservas</small>
        <MoneyValue value={custo} />
      </div>
      <span className={s.sep} aria-hidden />
      <div className={s.item}>
        <small>Receita da agência</small>
        <MoneyValue value={receitaPrevista} />
        {media !== null && <small>{rotuloComissaoMedia(media)}</small>}
      </div>
      <span className={s.sep} aria-hidden />
      {mostrarResultado && (
        <>
          <div className={s.item}>
            <small>Comissão do vendedor</small>
            <MoneyValue value={repasseValor} />
          </div>
          <span className={s.sep} aria-hidden />
          <div className={s.item}>
            <small>Despesas da viagem</small>
            <MoneyValue value={despesas} />
          </div>
          <span className={s.sep} aria-hidden />
          <div className={s.item} title={incompleta ? "Preencha o total cobrado do cliente das reservas" : undefined}>
            <small>
              Resultado da viagem{" "}
              <Tooltip text="Receita da agência − comissão do vendedor − despesas vinculadas">
                <CircleHelp size={16} aria-hidden />
              </Tooltip>
            </small>
            <MoneyValue value={incompleta ? null : resultado} emphasis="result" />
          </div>
        </>
      )}
      <Button variant="business" className={s.addReserva} onClick={onAdicionarReserva}>
        + Adicionar reserva
      </Button>
    </div>
  );
}
