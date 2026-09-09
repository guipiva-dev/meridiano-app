import { Trash2 } from "lucide-react";
import { useId } from "react";
import { type FornecedorDto, ROTULO_SERVICO } from "@/api/viagens";
import { Button, IconButton, MoneyValue } from "@/components";
import { Alert, StatusBadge } from "@/components/display";
import { calcularReserva } from "@/dominio/calculoReserva";
import { formatarDinheiro } from "@/lib/dinheiro";
import { BookingFields } from "./BookingFields";
import { FinancialFields } from "./FinancialFields";
import s from "./Reserva.module.css";
import { ResultSummary } from "./ResultSummary";
import { paraValoresReserva, type ReservaForm } from "./tipos";

interface ReservationCardProps {
  indice: number;
  value: ReservaForm;
  onChange: (patch: Partial<ReservaForm>) => void;
  onToggle: () => void;
  onRemover: () => void;
  fornecedores: FornecedorDto[];
  onNovoFornecedor: () => void;
  erros: Partial<Record<keyof ReservaForm, string>>;
  avisoDuplicada: string | null;
}

export function ReservationCard({
  indice,
  value,
  onChange,
  onToggle,
  onRemover,
  fornecedores,
  onNovoFornecedor,
  erros,
  avisoDuplicada,
}: ReservationCardProps) {
  const idTitulo = useId();
  const fornecedor = fornecedores.find((f) => f.id === value.fornecedorId);
  const resultado = calcularReserva(paraValoresReserva(value));
  const servicos = value.tiposServico.map((t) => ROTULO_SERVICO[t]).join(" · ");
  const percentualSugerido = fornecedor?.percentualComissaoPadrao ?? null;

  // <section> com nome acessível (aria-labelledby) já tem role="region" implícito (WAI-ARIA);
  // explícito seria redundante para o jsx-a11y, mas getByRole("region", { name }) funciona igual.
  return (
    <section aria-labelledby={idTitulo} className={s.card}>
      <header className={s.header}>
        <span id={idTitulo} className={s.numId}>
          Reserva {indice}
        </span>
        {fornecedor && <span className={s.fornecedor}>{fornecedor.nome}</span>}
        {value.localizador && <span className={s.localizador}>{value.localizador}</span>}
        <StatusBadge entidade="reserva" valor={value.status} />
        {servicos && <span className={s.servicos}>{servicos}</span>}
        <span className={s.total}>
          <MoneyValue value={value.valorCliente} />
          <small className={s.receitaSmall}>receita {formatarDinheiro(resultado.receitaPrevista)}</small>
        </span>
        <IconButton label="Remover reserva" icon={<Trash2 />} onClick={onRemover} />
        <Button variant="tertiary" size="sm" aria-expanded={value.aberta} onClick={onToggle}>
          {value.aberta ? "Recolher" : "Expandir"}
        </Button>
      </header>
      {value.aberta && (
        <div className={s.body}>
          {avisoDuplicada && <Alert tone="warning">{avisoDuplicada}</Alert>}
          <div className={s.group}>
            <div className={s.eyebrow}>Reserva</div>
            <BookingFields
              value={value}
              onChange={onChange}
              fornecedores={fornecedores}
              onNovoFornecedor={onNovoFornecedor}
              erros={erros}
            />
          </div>
          <div className={s.group}>
            <div className={s.eyebrow}>Financeiro</div>
            <FinancialFields value={value} onChange={onChange} percentualSugerido={percentualSugerido} erros={erros} />
          </div>
          <div className={s.group}>
            <div className={s.eyebrow}>Resultado desta reserva</div>
            <ResultSummary value={value} />
          </div>
        </div>
      )}
    </section>
  );
}
