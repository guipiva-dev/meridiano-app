import { useState } from "react";
import type { DespesaDto } from "@/api/despesas";
import { despesasApi } from "@/api/despesas";
import type { FormaPagamentoFin } from "@/api/financeiro";
import { Button, DateInput, Field, Select } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { formatarData, hojeIso } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";
import s from "./Financeiro.module.css";
import { MotivoField } from "./MotivoField";
import { CAMPO_POR_CODIGO_FIN, OPCOES_FORMA } from "./mapaErrosFinanceiro";
import { useMutacaoFinanceira } from "./useMutacaoFinanceira";

interface PagarDespesaModalProps {
  open: boolean;
  despesa: DespesaDto;
  onClose: () => void;
  onPaga: (d: DespesaDto, proxima: DespesaDto | null) => void;
}

interface ArgsPagar {
  pagoEm: string;
  formaPagamento: FormaPagamentoFin;
}

export function PagarDespesaModal({ open, despesa, onClose, onPaga }: PagarDespesaModalProps) {
  const [pagoEm, setPagoEm] = useState(hojeIso());
  const [forma, setForma] = useState<FormaPagamentoFin | "">(despesa.formaPagamento ?? "");
  const [erroLocal, setErroLocal] = useState<string>();
  const m = useMutacaoFinanceira<ArgsPagar, { despesa: DespesaDto; proxima: DespesaDto | null }>(
    (args, motivo) => despesasApi.pagar(despesa.id, args.pagoEm, args.formaPagamento, despesa.versao, motivo),
    CAMPO_POR_CODIGO_FIN,
  );

  function fechar() {
    setErroLocal(undefined);
    m.limpar();
    onClose();
  }

  async function enviarForm() {
    if (forma === "") {
      setErroLocal("Informe a forma de pagamento");
      return;
    }
    setErroLocal(undefined);
    const dto = await m.enviar({ pagoEm, formaPagamento: forma });
    if (dto) {
      onPaga(dto.despesa, dto.proxima);
      fechar();
    }
  }

  return (
    <Modal
      open={open}
      title={`Marcar paga · ${despesa.descricao}`}
      onClose={fechar}
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
            Confirmar pagamento
          </Button>
        </>
      }
    >
      <div className={s.grid}>
        {m.conflito && <Alert tone="danger">Alguém alterou esta despesa enquanto você decidia. Recarregue.</Alert>}
        {m.erroBloco && <Alert tone="danger">{m.erroBloco}</Alert>}
        <p className={s.impacto}>
          {formatarDinheiro(despesa.valor)} · vencimento {formatarData(despesa.vencimento)}
        </p>
        <Field label="Pago em" required error={m.erros.data}>
          <DateInput
            value={pagoEm}
            onChange={(e) => {
              setPagoEm(e.target.value);
            }}
          />
        </Field>
        <Field label="Forma de pagamento" required error={erroLocal ?? m.erros.formaPagamento}>
          <Select
            options={OPCOES_FORMA}
            placeholder="—"
            value={forma}
            onChange={(e) => {
              setForma(e.target.value as FormaPagamentoFin | "");
            }}
          />
        </Field>
        {m.precisaMotivo && <MotivoField value={m.motivo} onChange={m.setMotivo} erro={m.erros.motivo} />}
      </div>
    </Modal>
  );
}
