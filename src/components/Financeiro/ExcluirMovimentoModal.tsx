import { useState } from "react";
import type { MovimentoDto } from "@/api/financeiro";
import { financeiroApi } from "@/api/financeiro";
import { Button } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { apresentacaoStatus } from "@/dominio/status";
import { formatarData } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";
import s from "./Financeiro.module.css";
import { MotivoField } from "./MotivoField";
import { CAMPO_POR_CODIGO_FIN } from "./mapaErrosFinanceiro";
import { useMutacaoFinanceira } from "./useMutacaoFinanceira";

interface ExcluirMovimentoModalProps {
  open: boolean;
  movimento: MovimentoDto;
  onClose: () => void;
  onExcluido: () => void;
}

export function ExcluirMovimentoModal({ open, movimento, onClose, onExcluido }: ExcluirMovimentoModalProps) {
  const [erroLocal, setErroLocal] = useState<string>();
  // DELETE responde 204: o `true` só existe para distinguir sucesso do `null` de erro.
  const m = useMutacaoFinanceira<undefined, true>(
    (_args, motivo) => financeiroApi.excluir(movimento.id, motivo ?? "").then(() => true as const),
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
    if (await m.enviar(undefined)) {
      onExcluido();
      fechar();
    }
  }

  return (
    <Modal
      open={open}
      title="Excluir movimento"
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
            Excluir movimento
          </Button>
        </>
      }
    >
      <div className={s.grid}>
        {m.conflito && <Alert tone="danger">Alguém alterou este movimento enquanto você decidia. Recarregue.</Alert>}
        {m.erroBloco && <Alert tone="danger">{m.erroBloco}</Alert>}
        <p className={s.impacto}>
          {apresentacaoStatus("movimento_tipo", movimento.tipo).texto} de {formatarDinheiro(movimento.valor)} em{" "}
          {formatarData(movimento.dataMovimento)}. O saldo da reserva e o repasse são reavaliados.
        </p>
        <MotivoField value={m.motivo} onChange={m.setMotivo} erro={erroLocal ?? m.erros.motivo} />
      </div>
    </Modal>
  );
}
