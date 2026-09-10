import { useState } from "react";
import type { CategoriaDespesa, DespesaDto, DespesaRequest } from "@/api/despesas";
import { CATEGORIAS_DESPESA, despesasApi } from "@/api/despesas";
import type { FormaPagamentoFin } from "@/api/financeiro";
import type { FornecedorDto } from "@/api/viagens";
import { Button, DateInput, Field, Input, MoneyInput, Select, Textarea } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { apresentacaoStatus } from "@/dominio/status";
import s from "./Financeiro.module.css";
import { MotivoField } from "./MotivoField";
import { CAMPO_POR_CODIGO_FIN } from "./mapaErrosFinanceiro";
import { OPCOES_FORMA } from "./ReceberModal";
import { useMutacaoFinanceira } from "./useMutacaoFinanceira";
import type { ViagemOpcao } from "./ViagemCombobox";
import { ViagemCombobox } from "./ViagemCombobox";

interface DespesaModalProps {
  open: boolean;
  despesa?: DespesaDto;
  viagemFixa?: ViagemOpcao;
  fornecedores: FornecedorDto[];
  onClose: () => void;
  onSalva: (d: DespesaDto, proxima: DespesaDto | null) => void;
}

const OPCOES_CATEGORIA = CATEGORIAS_DESPESA.map((c) => ({
  value: c,
  label: apresentacaoStatus("despesa_categoria", c).texto,
}));
const OPCOES_SIM_NAO = [
  { value: "nao", label: "Não" },
  { value: "sim", label: "Sim" },
];
const OPCOES_SITUACAO = [
  { value: "a_pagar", label: "A pagar" },
  { value: "pago", label: "Pago" },
];
const AJUDA_RECORRENTE =
  "Ao pagar, o sistema cria a mesma despesa para o mês seguinte. Sem data limite, repete indefinidamente.";

export function DespesaModal({ open, despesa, viagemFixa, fornecedores, onClose, onSalva }: DespesaModalProps) {
  const [descricao, setDescricao] = useState(despesa?.descricao ?? "");
  const [valor, setValor] = useState<number | null>(despesa?.valor ?? null);
  const [categoria, setCategoria] = useState<CategoriaDespesa>(despesa?.categoria ?? "operacional");
  const [vencimento, setVencimento] = useState(despesa?.vencimento ?? "");
  const [pago, setPago] = useState(despesa?.pago ?? false);
  const [pagoEm, setPagoEm] = useState(despesa?.pagoEm ?? "");
  const [forma, setForma] = useState<FormaPagamentoFin | "">(despesa?.formaPagamento ?? "");
  const [recorrente, setRecorrente] = useState(despesa?.recorrente ?? false);
  const [recorrenciaAte, setRecorrenciaAte] = useState(despesa?.recorrenciaAte ?? "");
  const [viagem, setViagem] = useState<ViagemOpcao | null>(
    despesa?.viagemId ? { id: despesa.viagemId, rotulo: despesa.codigoViagem ?? despesa.viagemId } : null,
  );
  const [fornecedorId, setFornecedorId] = useState(despesa?.fornecedorId ?? "");
  const [observacao, setObservacao] = useState(despesa?.observacao ?? "");
  const [errosLocais, setErrosLocais] = useState<Record<string, string>>({});
  const m = useMutacaoFinanceira<DespesaRequest, { despesa: DespesaDto; proxima: DespesaDto | null }>(
    async (req, motivo) =>
      despesa
        ? { despesa: await despesasApi.atualizar(despesa.id, req, motivo), proxima: null }
        : await despesasApi.criar(req, motivo),
    CAMPO_POR_CODIGO_FIN,
  );

  function fechar() {
    setErrosLocais({});
    m.limpar();
    onClose();
  }

  async function enviarForm() {
    const locais: Record<string, string> = {};
    if (!descricao.trim()) locais.descricao = "Descrição é obrigatória";
    if (!vencimento) locais.vencimento = "Vencimento é obrigatório";
    if (pago && !pagoEm) locais.pagoEm = "Informe a data do pagamento";
    if (pago && !forma) locais.formaPagamento = "Informe a forma de pagamento";
    setErrosLocais(locais);
    if (Object.keys(locais).length) return;

    const dto = await m.enviar({
      descricao: descricao.trim(),
      categoria,
      valor: valor ?? 0,
      vencimento,
      pago,
      pagoEm: pago ? pagoEm : null,
      formaPagamento: forma === "" ? null : forma,
      recorrente,
      recorrenciaAte: recorrente ? recorrenciaAte || null : null,
      viagemId: viagemFixa?.id ?? viagem?.id ?? null,
      fornecedorId: fornecedorId || null,
      observacao: observacao.trim() || null,
      versao: despesa?.versao,
    });
    if (dto) {
      onSalva(dto.despesa, dto.proxima);
      fechar();
    }
  }

  const erro = (campo: string) => errosLocais[campo] ?? m.erros[campo];

  return (
    <Modal
      open={open}
      title={despesa ? "Editar despesa" : "Nova despesa"}
      onClose={fechar}
      size="lg"
      footer={
        <>
          <Button variant="tertiary" onClick={fechar}>
            Voltar
          </Button>
          <Button
            variant="primary"
            loading={m.salvando}
            onClick={() => {
              void enviarForm();
            }}
          >
            {despesa ? "Salvar despesa" : "Lançar despesa"}
          </Button>
        </>
      }
    >
      <div className={s.grid2}>
        {m.conflito && (
          <div className={s.span2}>
            <Alert tone="danger">Alguém alterou esta despesa enquanto você editava. Recarregue.</Alert>
          </div>
        )}
        {m.erroBloco && (
          <div className={s.span2}>
            <Alert tone="danger">{m.erroBloco}</Alert>
          </div>
        )}
        {despesa?.recorrente && (
          <div className={s.span2}>
            <Alert tone="info">Editar afeta só esta ocorrência.</Alert>
          </div>
        )}
        <Field label="Descrição" required error={erro("descricao")} className={s.span2}>
          <Input
            value={descricao}
            onChange={(e) => {
              setDescricao(e.target.value);
            }}
          />
        </Field>
        <Field label="Valor" required error={erro("valor")}>
          <MoneyInput value={valor} onChange={setValor} />
        </Field>
        <Field label="Categoria" required error={erro("categoria")}>
          <Select
            options={OPCOES_CATEGORIA}
            value={categoria}
            onChange={(e) => {
              setCategoria(e.target.value as CategoriaDespesa);
            }}
          />
        </Field>
        <Field label="Vencimento" required error={erro("vencimento")}>
          <DateInput
            value={vencimento}
            onChange={(e) => {
              setVencimento(e.target.value);
            }}
          />
        </Field>
        <Field label="Situação">
          <Select
            options={OPCOES_SITUACAO}
            value={pago ? "pago" : "a_pagar"}
            onChange={(e) => {
              setPago(e.target.value === "pago");
            }}
          />
        </Field>
        {pago && (
          <Field label="Pago em" required error={erro("pagoEm")}>
            <DateInput
              value={pagoEm}
              onChange={(e) => {
                setPagoEm(e.target.value);
              }}
            />
          </Field>
        )}
        <Field label="Forma de pagamento" required={pago} error={erro("formaPagamento")}>
          <Select
            options={OPCOES_FORMA}
            placeholder="—"
            value={forma}
            onChange={(e) => {
              setForma(e.target.value as FormaPagamentoFin | "");
            }}
          />
        </Field>
        <Field label="Repete todo mês" tooltip={AJUDA_RECORRENTE} helper={AJUDA_RECORRENTE}>
          <Select
            options={OPCOES_SIM_NAO}
            value={recorrente ? "sim" : "nao"}
            onChange={(e) => {
              setRecorrente(e.target.value === "sim");
            }}
          />
        </Field>
        {recorrente && (
          <Field label="Repetir até" helper="Opcional: em branco repete sem prazo">
            <DateInput
              value={recorrenciaAte}
              onChange={(e) => {
                setRecorrenciaAte(e.target.value);
              }}
            />
          </Field>
        )}
        {!viagemFixa && (
          <div className={s.span2}>
            <ViagemCombobox value={viagem} onChange={setViagem} helper="Opcional" erro={erro("viagemId")} />
          </div>
        )}
        <Field label="Fornecedor">
          <Select
            options={fornecedores.map((f) => ({ value: f.id, label: f.nome }))}
            placeholder="—"
            value={fornecedorId}
            onChange={(e) => {
              setFornecedorId(e.target.value);
            }}
          />
        </Field>
        <Field label="Observação" className={s.span2}>
          <Textarea
            value={observacao}
            onChange={(e) => {
              setObservacao(e.target.value);
            }}
          />
        </Field>
        {m.precisaMotivo && (
          <div className={s.span2}>
            <MotivoField value={m.motivo} onChange={m.setMotivo} erro={m.erros.motivo} />
          </div>
        )}
      </div>
    </Modal>
  );
}
