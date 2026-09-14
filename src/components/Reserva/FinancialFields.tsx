import { type ChangeEvent, useState } from "react";
import { FORMAS_PAGAMENTO, type FormaPagamento, ROTULO_FORMA } from "@/api/viagens";
import { Field, Input, MoneyInput, useField } from "@/components";
import { Chip } from "@/components/display";
import { calcularReserva } from "@/dominio/calculoReserva";
import { comissaoPorPercentual, parsearPercentual, percentualDaComissao } from "@/lib/comissao";
import s from "./Reserva.module.css";
import { paraValoresReserva, type ReservaForm } from "./tipos";

interface FinancialFieldsProps {
  value: ReservaForm;
  onChange: (patch: Partial<ReservaForm>) => void;
  percentualSugerido: number | null;
  erros: Partial<Record<keyof ReservaForm, string>>;
  /** Reserva cancelada: todos os campos viram leitura/seleção travada. */
  readOnly?: boolean;
}

/** Sem componente Textarea compartilhado: copia o padrão do Input (useField p/ id/aria) localmente. */
function Observacoes({
  value,
  onChange,
  readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  readOnly: boolean;
}) {
  const f = useField();
  return (
    <textarea
      id={f?.id}
      aria-describedby={f?.describedBy}
      aria-invalid={f?.invalid ? true : undefined}
      rows={4}
      maxLength={2000}
      className={s.control}
      value={value}
      readOnly={readOnly}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
      }}
    />
  );
}

export function FinancialFields({
  value,
  onChange,
  percentualSugerido,
  erros,
  readOnly = false,
}: FinancialFieldsProps) {
  function alternarForma(forma: FormaPagamento) {
    const atual = value.formasPagamento;
    onChange({
      formasPagamento: atual.includes(forma) ? atual.filter((f) => f !== forma) : [...atual, forma],
    });
  }
  // % digitado vira âncora: mudar o total recalcula o R$. Digitar R$ solta a âncora e o % passa a ser derivado.
  const [pctTexto, setPctTexto] = useState<string | null>(null);
  const [erroPct, setErroPct] = useState<string | null>(null);
  const pctDerivado = percentualDaComissao(value.valorComissao, value.valorTotal);
  const pctMostrado = pctTexto ?? (pctDerivado === null ? "" : String(pctDerivado).replace(".", ","));

  function mudarPct(texto: string) {
    const p = parsearPercentual(texto);
    // Como o MoneyInput: entrada inválida não é aceita, então nunca chega ao formulário.
    if (p === "invalido") {
      setErroPct("Percentual inválido");
      return;
    }
    if (p === "negativo" || (p !== null && p > 100)) {
      setErroPct("Percentual deve ficar entre 0 e 100");
      return;
    }
    setErroPct(null);
    setPctTexto(texto);
    onChange({
      valorComissao: p === null ? null : comissaoPorPercentual(p, value.valorTotal),
      comissaoSugerida: false,
    });
  }
  function mudarValorComissao(v: number | null) {
    setPctTexto(null);
    setErroPct(null);
    onChange({ valorComissao: v, comissaoSugerida: false });
  }
  function mudarTotal(v: number | null) {
    const p = pctTexto === null ? null : parsearPercentual(pctTexto);
    // A03: venda ainda vazia, ou ainda sugerida (usuário não digitou à mão) — sugere/ressincroniza venda = total.
    // Na digitação, não no blur: o Tab cai direto no Total cobrado, que lê o valor no foco (antes do re-render do blur).
    const venda =
      v && (value.valorCliente === null || value.vendaSugerida) ? { valorCliente: v, vendaSugerida: true } : {};
    onChange({
      valorTotal: v,
      ...venda,
      ...(typeof p === "number"
        ? {
            valorComissao: comissaoPorPercentual(p, v),
            comissaoSugerida: false,
          }
        : {}),
    });
  }
  const r = calcularReserva(paraValoresReserva(value));
  const helperComissao =
    value.comissaoSugerida && percentualSugerido !== null ? `Sugerido: ${percentualSugerido} %` : undefined;

  return (
    <div className="grid-form">
      <Field
        label="Total da reserva"
        className="span-2"
        tooltip="O que o fornecedor cobrou, taxas incluídas"
        error={erros.valorTotal}
      >
        <MoneyInput value={value.valorTotal} readOnly={readOnly} onChange={mudarTotal} />
      </Field>
      <Field
        label="Total cobrado do cliente"
        className="span-2"
        tooltip="Quanto o cliente pagou no total. Começa igual ao total da reserva; mude se cobrou a mais (RAV) ou deu desconto."
        error={erros.valorCliente}
      >
        <MoneyInput
          value={value.valorCliente}
          readOnly={readOnly}
          calculated={value.vendaSugerida}
          onChange={(v) => {
            onChange({ valorCliente: v, vendaSugerida: false });
          }}
        />
      </Field>
      <Field
        label="Comissão (%)"
        className="span-2"
        tooltip="O que o fornecedor paga à agência (ex.: 10% de R$ 10.000 = R$ 1.000)."
        helper={helperComissao}
        error={erroPct ?? undefined}
      >
        <Input
          inputMode="decimal"
          value={pctMostrado}
          readOnly={readOnly}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            mudarPct(e.target.value);
          }}
        />
      </Field>
      <Field label="Comissão (R$)" className="span-2" error={erros.valorComissao}>
        <MoneyInput value={value.valorComissao} readOnly={readOnly} onChange={mudarValorComissao} />
      </Field>
      <Field
        label="RAV"
        className="span-2"
        tooltip="Calculado: total cobrado do cliente − total da reserva (ex.: R$ 10.500 − R$ 10.000 = R$ 500). Negativo = desconto."
      >
        <MoneyInput value={r.ravCliente} readOnly calculated onChange={() => undefined} tabIndex={-1} />
      </Field>
      <Field label="Total da comissão" className="span-2" tooltip="Comissão + RAV.">
        <MoneyInput value={r.totalComissao} readOnly calculated onChange={() => undefined} tabIndex={-1} />
      </Field>
      <Field
        label="Taxa de serviço"
        className="span-2"
        tooltip="Valor fixo cobrado do cliente sem custo por trás, como assessoria ou emissão de visto (ex.: R$ 150)."
        helper="Cobrada do cliente por fora da reserva; soma direto na receita da agência."
        error={erros.taxaServico}
      >
        <MoneyInput
          value={value.taxaServico}
          readOnly={readOnly}
          onChange={(v) => {
            onChange({ taxaServico: v });
          }}
        />
      </Field>
      <Field label="Formas de pagamento" className="span-2">
        <div role="group" aria-label="Formas de pagamento" className={s.chips}>
          {FORMAS_PAGAMENTO.map((forma) => (
            <Chip
              key={forma}
              selected={value.formasPagamento.includes(forma)}
              disabled={readOnly}
              onClick={() => {
                alternarForma(forma);
              }}
            >
              {ROTULO_FORMA[forma]}
            </Chip>
          ))}
        </div>
      </Field>
      <details className={s.mais}>
        <summary>+ mais campos (taxas do fornecedor, observações)</summary>
        <div className="grid-form">
          <Field label="Do total, quanto é taxa" className="span-2" error={erros.valorTaxas}>
            <MoneyInput
              value={value.valorTaxas}
              readOnly={readOnly}
              onChange={(v) => {
                onChange({ valorTaxas: v });
              }}
            />
          </Field>
          <Field label="Observações" className="span-12">
            <Observacoes
              value={value.observacoes}
              readOnly={readOnly}
              onChange={(v) => {
                onChange({ observacoes: v });
              }}
            />
          </Field>
        </div>
      </details>
    </div>
  );
}
