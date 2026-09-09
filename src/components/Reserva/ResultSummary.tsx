import { MoneyValue } from "@/components";
import { calcularReserva } from "@/dominio/calculoReserva";
import { cx } from "@/lib/cx";
import s from "./Reserva.module.css";
import { paraValoresReserva, type ReservaForm } from "./tipos";

export function ResultSummary({ value }: { value: ReservaForm }) {
  const r = calcularReserva(paraValoresReserva(value));
  return (
    <div className={s.result}>
      <div className={s.resultItem}>
        <small>Venda ao cliente</small>
        <MoneyValue value={value.valorCliente} />
        <span className={s.sub}>contratado</span>
      </div>
      <div className={s.resultItem}>
        <small>Custo</small>
        <MoneyValue value={value.valorTotal} />
        <span className={s.sub}>total do fornecedor</span>
      </div>
      <div className={s.resultItem}>
        <small>Comissão + RAV op.</small>
        <MoneyValue value={r.valorEsperadoOperadora} />
        <span className={s.sub}>esperado da operadora</span>
      </div>
      <div className={s.resultItem}>
        <small>RAV do cliente</small>
        <MoneyValue value={r.ravCliente} />
        <span className={s.sub}>venda − custo</span>
      </div>
      <div className={cx(s.resultItem, s.resultHighlight)}>
        <small>Receita da agência</small>
        <MoneyValue value={r.receitaPrevista} emphasis="result" />
        <span className={s.sub}>prevista</span>
      </div>
    </div>
  );
}
