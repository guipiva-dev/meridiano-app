import type { UseFormReturn } from "react-hook-form";
import type { TipoFornecedor } from "@/api/fornecedores";
import { Field, Input, Select, Textarea } from "@/components";
import { apresentacaoStatus } from "@/dominio/status";
import { cnpjValido, siteValido, telefoneValido } from "@/lib/documentos";
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
  const { register, watch, formState } = form;
  const nome = watch("nome");
  const cnpj = watch("cnpj");
  // Só mostra "obrigatório" depois que o usuário passou pelo campo (evita erro no form em branco recém-aberto).
  const erroNome = erros.nome ?? (formState.touchedFields.nome && !nome.trim() ? "Nome é obrigatório" : undefined);
  const erroCnpj = erros.cnpj ?? (cnpj && !cnpjValido(cnpj) ? "CNPJ inválido" : undefined);
  const telefone = watch("telefone");
  const telefoneEmergencia = watch("telefoneEmergencia");
  const site = watch("site");
  const observacoes = (watch("observacoes") as string | undefined) ?? "";
  const erroTelefone = erros.telefone ?? (telefone && !telefoneValido(telefone) ? "Telefone inválido" : undefined);
  const erroTelefoneEmergencia =
    erros.telefoneEmergencia ??
    (telefoneEmergencia && !telefoneValido(telefoneEmergencia) ? "Telefone inválido" : undefined);
  const erroSite = erros.site ?? (site && !siteValido(site) ? "Site inválido" : undefined);
  return (
    <div className={s.grid}>
      <Field label="Nome" required error={erroNome} className={s.span2}>
        <Input maxLength={150} {...register("nome")} />
      </Field>

      <Field label="Tipo" error={erros.tipo}>
        <Select options={OPCOES_TIPO} {...register("tipo")} />
      </Field>
      <Field label="CNPJ" error={erroCnpj}>
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
      <Field label="Telefone de emergência" error={erroTelefoneEmergencia}>
        <Input {...register("telefoneEmergencia")} />
      </Field>

      <Field
        label="Situação"
        helper="Inativo não aparece ao lançar reserva nova; histórico permanece"
        error={erros.ativo}
      >
        <Select options={OPCOES_SITUACAO} {...register("ativo")} />
      </Field>
      <Field label="Site / portal" error={erroSite}>
        <Input {...register("site")} />
      </Field>

      <Field label="Contato comercial" error={erros.contato}>
        <Input {...register("contato")} />
      </Field>
      <Field label="Telefone" error={erroTelefone}>
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

      <Field label="Observações" helper={`${observacoes.length}/2000`} error={erros.observacoes} className={s.span2}>
        <Textarea maxLength={2000} {...register("observacoes")} />
      </Field>
    </div>
  );
}
