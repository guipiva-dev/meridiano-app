import { useState } from "react";
import type { PeriodoDto } from "@/api/fechamento";
import { fechamentoApi } from "@/api/fechamento";
import { Button } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { nomeMes } from "@/lib/datas";
import s from "./Financeiro.module.css";
import { MotivoField } from "./MotivoField";
import { CAMPO_POR_CODIGO_FIN } from "./mapaErrosFinanceiro";
import { useMutacaoFinanceira } from "./useMutacaoFinanceira";

interface ReabrirModalProps {
  open: boolean;
  periodo: PeriodoDto;
  onClose: () => void;
  onReaberto: (p: PeriodoDto) => void;
}

export function ReabrirModal({ open, periodo, onClose, onReaberto }: ReabrirModalProps) {
  const [erroLocal, setErroLocal] = useState<string>();
  const m = useMutacaoFinanceira<undefined, PeriodoDto>(
    (_args, motivo) => fechamentoApi.reabrir(periodo.competencia, motivo ?? ""),
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
      onReaberto(dto);
      fechar();
    }
  }

  const mes = nomeMes(periodo.competencia);

  return (
    <Modal
      open={open}
      title={`Reabrir ${mes}?`}
      onClose={fechar}
      footer={
        <>
          <Button variant="tertiary" onClick={fechar}>
            Voltar
          </Button>
          <Button
            variant="danger"
            loading={m.salvando}
            onClick={() => {
              void enviarForm();
            }}
          >
            Reabrir {mes}
          </Button>
        </>
      }
    >
      <div className={s.grid}>
        {m.conflito && <Alert tone="danger">O período mudou enquanto você decidia. Recarregue.</Alert>}
        {m.erroBloco && <Alert tone="danger">{m.erroBloco}</Alert>}
        <p className={s.impacto}>A reabertura fica na auditoria com o motivo.</p>
        <MotivoField value={m.motivo} onChange={m.setMotivo} erro={erroLocal ?? m.erros.motivo} />
      </div>
    </Modal>
  );
}
