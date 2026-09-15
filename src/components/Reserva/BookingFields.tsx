import type { ChangeEvent } from "react";
import type { FornecedorDto, NfseStatus } from "@/api/viagens";
import { Button, DateInput, Field, Input, Select } from "@/components";
import s from "./Reserva.module.css";
import { ServiceChips } from "./ServiceChips";
import type { ReservaForm } from "./tipos";

const ROTULO_NFSE: Record<NfseStatus, string> = {
  nao_precisa: "Não precisa",
  falta_emitir: "Falta emitir",
  emitido: "Emitida",
};
const OPCOES_NFSE = (["nao_precisa", "falta_emitir", "emitido"] as const).map((valor) => ({
  value: valor,
  label: ROTULO_NFSE[valor],
}));

interface BookingFieldsProps {
  value: ReservaForm;
  onChange: (patch: Partial<ReservaForm>) => void;
  fornecedores: FornecedorDto[];
  onNovoFornecedor: () => void;
  erros: Partial<Record<keyof ReservaForm, string>>;
  /** Reserva cancelada: todos os campos viram leitura/seleção travada. */
  readOnly?: boolean;
}

export function BookingFields({
  value,
  onChange,
  fornecedores,
  onNovoFornecedor,
  erros,
  readOnly = false,
}: BookingFieldsProps) {
  const opcoesFornecedor = fornecedores.map((f) => ({ value: f.id, label: f.nome }));
  return (
    <div className="grid-form">
      <Field label="Fornecedor" className="span-4" error={erros.fornecedorId}>
        <div className={s.fornecedorRow}>
          <Select
            options={opcoesFornecedor}
            placeholder="Selecione"
            value={value.fornecedorId}
            disabled={readOnly}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              onChange({ fornecedorId: e.target.value });
            }}
            onBlur={() => {
              // A04: só depois de tocar o campo (ou tentar salvar) o erro "Escolha o fornecedor" aparece.
              onChange({ fornecedorTocado: true });
            }}
          />
          <Button variant="tertiary" size="sm" disabled={readOnly} onClick={onNovoFornecedor}>
            + novo
          </Button>
        </div>
      </Field>
      <Field label="Localizador" className="span-3" error={erros.localizador}>
        <Input
          className={s.mono}
          value={value.localizador}
          readOnly={readOnly}
          maxLength={40}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            onChange({ localizador: e.target.value });
          }}
        />
      </Field>
      <Field label="Data da compra" className="span-2" error={erros.dataCompra}>
        <DateInput
          value={value.dataCompra}
          readOnly={readOnly}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            onChange({ dataCompra: e.target.value });
          }}
        />
      </Field>
      <Field label="NFSe" className="span-3" error={erros.nfseStatus}>
        <Select
          options={OPCOES_NFSE}
          value={value.nfseStatus}
          disabled={readOnly}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            onChange({ nfseStatus: e.target.value as NfseStatus });
          }}
        />
      </Field>
      <Field label="Serviços vendidos" className="span-12">
        <ServiceChips
          value={value.tiposServico}
          disabled={readOnly}
          onChange={(v) => {
            onChange({ tiposServico: v });
          }}
        />
      </Field>
    </div>
  );
}
