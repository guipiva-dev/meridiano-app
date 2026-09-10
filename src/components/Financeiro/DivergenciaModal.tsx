import { useState } from "react";
import type { ConciliacaoItemDto } from "@/api/financeiro";
import { financeiroApi } from "@/api/financeiro";
import { Button } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { formatarDinheiro } from "@/lib/dinheiro";
import s from "./Financeiro.module.css";
import { MotivoField } from "./MotivoField";
import { CAMPO_POR_CODIGO_FIN } from "./mapaErrosFinanceiro";
import { useMutacaoFinanceira } from "./useMutacaoFinanceira";

interface DivergenciaModalProps {
  open: boolean;
  item: ConciliacaoItemDto;
  onClose: () => void;
  onEncerrada: (i: ConciliacaoItemDto) => void;
}

export function DivergenciaModal({ open, item, onClose, onEncerrada }: DivergenciaModalProps) {
  const [erroLocal, setErroLocal] = useState<string>();
  const m = useMutacaoFinanceira<undefined, ConciliacaoItemDto>(
    (_args, motivo) => financeiroApi.encerrarDivergencia(item.reservaId, motivo ?? ""),
    CAMPO_POR_CODIGO_FIN,
  );

  function fechar() {
    setErroLocal(undefined);
    m.limpar();
    onClose();
  }

  async function enviarForm() {
    if (!m.motivo.trim()) {
      setErroLocal("Motivo é obrigatório");
      return;
    }
    setErroLocal(undefined);
    const dto = await m.enviar(undefined);
    if (dto) {
      onEncerrada(dto);
      fechar();
    }
  }

  return (
    <Modal
      open={open}
      title={`Encerrar com divergência · ${item.fornecedorNome}`}
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
            Encerrar com divergência
          </Button>
        </>
      }
    >
      <div className={s.grid}>
        {m.conflito && <Alert tone="danger">Alguém alterou esta reserva enquanto você decidia. Recarregue.</Alert>}
        {m.erroBloco && <Alert tone="danger">{m.erroBloco}</Alert>}
        <p className={s.impacto}>
          A reserva sai da conciliação com {formatarDinheiro(item.recebido)} recebidos (esperado{" "}
          {formatarDinheiro(item.esperado)}). O repasse é reavaliado.
        </p>
        <MotivoField value={m.motivo} onChange={m.setMotivo} erro={erroLocal ?? m.erros.motivo} />
      </div>
    </Modal>
  );
}
