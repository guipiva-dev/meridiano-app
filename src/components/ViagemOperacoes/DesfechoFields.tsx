import type { ChangeEvent } from "react";
import type { Desfecho, PassageiroDto } from "@/api/viagens";
import { Checkbox, DateInput, Field, MoneyInput, Select } from "@/components";
import { hojeIso } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";

export interface CreditoValor {
  valor: number | null;
  validade: string | null;
  clienteId: string | null;
}

export interface DesfechoValue {
  desfecho: Desfecho;
  valorReembolso: number | null;
  comissaoMantida: boolean;
  credito: CreditoValor | null;
}

interface DesfechoFieldsProps {
  value: DesfechoValue;
  onChange: (v: DesfechoValue) => void;
  erros: Record<string, string>;
  passageiros: PassageiroDto[];
  /** A22: venda ao cliente da reserva — crédito/reembolso não pode passar disso. */
  valorVenda?: number;
}

const OPCOES_DESFECHO = [
  { value: "sem_reembolso", label: "Sem reembolso" },
  { value: "reembolso", label: "Reembolso" },
  { value: "credito", label: "Crédito" },
];

export function DesfechoFields({ value, onChange, erros, passageiros, valorVenda }: DesfechoFieldsProps) {
  function excedeVenda(valor: number | null): string | undefined {
    if (valorVenda === undefined || valor === null || valor <= valorVenda) return undefined;
    return `Não pode passar de ${formatarDinheiro(valorVenda)} (venda ao cliente)`;
  }

  function mudarDesfecho(desfecho: Desfecho) {
    if (desfecho === "credito") {
      const titular = passageiros.find((p) => p.titular);
      onChange({
        desfecho,
        valorReembolso: null,
        comissaoMantida: value.comissaoMantida,
        credito: value.credito ?? { valor: null, validade: null, clienteId: titular?.clienteId ?? null },
      });
    } else if (desfecho === "reembolso") {
      onChange({
        desfecho,
        valorReembolso: value.valorReembolso,
        comissaoMantida: value.comissaoMantida,
        credito: null,
      });
    } else {
      onChange({ desfecho, valorReembolso: null, comissaoMantida: value.comissaoMantida, credito: null });
    }
  }

  return (
    <>
      <Field label="Desfecho" error={erros.desfecho}>
        <Select
          options={OPCOES_DESFECHO}
          value={value.desfecho}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            mudarDesfecho(e.target.value as Desfecho);
          }}
        />
      </Field>
      {value.desfecho === "reembolso" && (
        <Field label="Valor do reembolso" error={erros.valorReembolso ?? excedeVenda(value.valorReembolso)}>
          <MoneyInput
            value={value.valorReembolso}
            onChange={(v) => {
              onChange({ ...value, valorReembolso: v });
            }}
          />
        </Field>
      )}
      {value.desfecho === "credito" &&
        value.credito &&
        (() => {
          const credito = value.credito;
          const hoje = hojeIso();
          const validadePassada = credito.validade !== null && credito.validade < hoje;
          return (
            <>
              <Field label="Valor do crédito" error={erros["credito.valor"] ?? excedeVenda(credito.valor)}>
                <MoneyInput
                  value={credito.valor}
                  onChange={(v) => {
                    onChange({ ...value, credito: { ...credito, valor: v } });
                  }}
                />
              </Field>
              <Field
                label="Validade"
                error={validadePassada ? "Validade não pode estar no passado" : erros["credito.validade"]}
              >
                <DateInput
                  min={hoje}
                  value={credito.validade ?? ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    onChange({ ...value, credito: { ...credito, validade: e.target.value || null } });
                  }}
                />
              </Field>
              <Field label="Crédito em nome de" error={erros["credito.clienteId"]}>
                <Select
                  options={passageiros.map((p) => ({ value: p.clienteId, label: p.nome }))}
                  value={credito.clienteId ?? ""}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    onChange({ ...value, credito: { ...credito, clienteId: e.target.value || null } });
                  }}
                />
              </Field>
            </>
          );
        })()}
      <Checkbox
        label="Operadora mantém a comissão"
        checked={value.comissaoMantida}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          onChange({ ...value, comissaoMantida: e.target.checked });
        }}
      />
    </>
  );
}
