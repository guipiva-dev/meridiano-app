import { useState } from "react";
import type { RepasseItemDto, VendedorRepassesDto } from "@/api/repasses";
import { repassesApi } from "@/api/repasses";
import { Button, DateInput, Field, Input } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { hojeIso } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";
import s from "./Financeiro.module.css";
import { MotivoField } from "./MotivoField";
import { CAMPO_POR_CODIGO_FIN } from "./mapaErrosFinanceiro";
import { useMutacaoFinanceira } from "./useMutacaoFinanceira";

interface PagarRepasseModalProps {
  open: boolean;
  vendedor: VendedorRepassesDto;
  itens: RepasseItemDto[];
  onClose: () => void;
  onPagos: (p: RepasseItemDto[]) => void;
}

interface ArgsPagar {
  pagoEm: string;
  observacao: string | null;
}

export function PagarRepasseModal({ open, vendedor, itens, onClose, onPagos }: PagarRepasseModalProps) {
  const [pagoEm, setPagoEm] = useState(hojeIso());
  const [observacao, setObservacao] = useState("");
  const m = useMutacaoFinanceira<ArgsPagar, { pagos: RepasseItemDto[] }>(
    (args, motivo) =>
      repassesApi.pagarLote(
        itens.map((i) => i.id),
        args.pagoEm,
        args.observacao,
        motivo,
      ),
    CAMPO_POR_CODIGO_FIN,
  );

  function fechar() {
    setPagoEm(hojeIso());
    setObservacao("");
    m.limpar();
    onClose();
  }

  async function enviarForm() {
    const dto = await m.enviar({ pagoEm, observacao: observacao.trim() || null });
    if (dto) {
      onPagos(dto.pagos);
      fechar();
    }
  }

  const total = itens.reduce((soma, i) => soma + (i.valor ?? 0), 0);

  return (
    <Modal
      open={open}
      title={`Pagar ${formatarDinheiro(total)} a ${vendedor.nome}?`}
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
        {m.conflito && <Alert tone="danger">Algum repasse mudou enquanto você decidia. Recarregue.</Alert>}
        {m.erroBloco && <Alert tone="danger">{m.erroBloco}</Alert>}
        <p className={s.impacto}>
          {itens.length} viagens saem de &ldquo;a pagar&rdquo; para &ldquo;pago&rdquo; com a data abaixo. O valor pago
          fica congelado mesmo que a viagem mude depois.
        </p>
        <Field label="Pago em" required error={m.erros.data}>
          <DateInput
            value={pagoEm}
            onChange={(e) => {
              setPagoEm(e.target.value);
            }}
          />
        </Field>
        <Field label="Observação">
          <Input
            value={observacao}
            onChange={(e) => {
              setObservacao(e.target.value);
            }}
          />
        </Field>
        {m.precisaMotivo && <MotivoField value={m.motivo} onChange={m.setMotivo} erro={m.erros.motivo} />}
      </div>
    </Modal>
  );
}
