import type { UseFormReturn } from "react-hook-form";
import type { TipoFornecedor } from "@/api/fornecedores";
import { Field, Input, Select, Textarea } from "@/components";
import { apresentacaoStatus } from "@/dominio/status";
import s from "./Fornecedores.module.css";
import type { FormFornecedor } from "./useFornecedor";

const TIPOS: TipoFornecedor[] = [
  "operadora",
  "consolidadora",
  "cia_aerea",
  "hotel",
  "seguradora",
  "receptivo",
  "despachante",
  "outro",
];
const OPCOES_TIPO = TIPOS.map((t) => ({ value: t, label: apresentacaoStatus("fornecedor_tipo", t).texto }));
const OPCOES_SITUACAO = [
  { value: "true", label: "Ativo" },
  { value: "false", label: "Inativo" },
];

interface DadosFornecedorFormProps {
  form: UseFormReturn<FormFornecedor>;
  erros: Record<string, string>;
}

export function DadosFornecedorForm({ form, erros }: DadosFornecedorFormProps) {
  const { register } = form;
  return (
    <div className={s.grid}>
      <Field label="Nome" required error={erros.nome} className={s.span2}>
        <Input {...register("nome")} />
      </Field>

      <Field label="Tipo" error={erros.tipo}>
        <Select options={OPCOES_TIPO} {...register("tipo")} />
      </Field>
      <Field label="CNPJ" error={erros.cnpj}>
        <Input className={s.mono} inputMode="numeric" {...register("cnpj")} />
      </Field>

      <Field
        label="Comissão padrão"
        helper="Pré-preenche a comissão no lançamento como valor sugerido"
        error={erros.percentualComissaoPadrao}
      >
        <div className={s.comSufixo}>
          <Input type="number" step="0.1" min="0" {...register("percentualComissaoPadrao")} />
          <span className={s.sufixo}>%</span>
        </div>
      </Field>
      <Field label="Telefone de emergência" error={erros.telefoneEmergencia}>
        <Input {...register("telefoneEmergencia")} />
      </Field>

      <Field
        label="Situação"
        helper="Inativo não aparece ao lançar reserva nova; histórico permanece"
        error={erros.ativo}
      >
        <Select options={OPCOES_SITUACAO} {...register("ativo")} />
      </Field>
      <Field label="Site / portal" error={erros.site}>
        <Input {...register("site")} />
      </Field>

      <Field label="Contato comercial" error={erros.contato}>
        <Input {...register("contato")} />
      </Field>
      <Field label="Telefone" error={erros.telefone}>
        <Input {...register("telefone")} />
      </Field>

      <Field
        label="Prazo de comissão (dias)"
        helper="Usado quando não há janela para o dia da compra"
        error={erros.prazoComissaoDias}
      >
        <Input type="number" min="0" {...register("prazoComissaoDias")} />
      </Field>
      <div />

      <Field label="Observações" error={erros.observacoes} className={s.span2}>
        <Textarea {...register("observacoes")} />
      </Field>
    </div>
  );
}
