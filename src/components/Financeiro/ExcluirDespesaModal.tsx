import type { DespesaDto } from "@/api/despesas";
import { despesasApi } from "@/api/despesas";
import { Button } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { formatarData } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";
import s from "./Financeiro.module.css";
import { MotivoField } from "./MotivoField";
import { CAMPO_POR_CODIGO_FIN } from "./mapaErrosFinanceiro";
import { useMutacaoFinanceira } from "./useMutacaoFinanceira";

interface ExcluirDespesaModalProps {
  open: boolean;
  despesa: DespesaDto;
  onClose: () => void;
  onExcluida: () => void;
}

/** Exclusão de despesa: motivo é opcional a menos que o back recuse com 422 `motivo_obrigatorio` (período fechado). */
export function ExcluirDespesaModal({ open, despesa, onClose, onExcluida }: ExcluirDespesaModalProps) {
  // DELETE responde 204: o `true` só existe para distinguir sucesso do `null` de erro.
  const m = useMutacaoFinanceira<undefined, true>(
    (_args, motivo) => despesasApi.excluir(despesa.id, motivo).then(() => true as const),
    CAMPO_POR_CODIGO_FIN,
  );

  function fechar() {
    m.limpar();
    onClose();
  }

  async function confirmar() {
    if (await m.enviar(undefined)) {
      onExcluida();
      fechar();
    }
  }

  return (
    <Modal
      open={open}
      title="Excluir despesa"
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
              void confirmar();
            }}
          >
            Excluir despesa
          </Button>
        </>
      }
    >
      <div className={s.grid}>
        {m.conflito && <Alert tone="danger">Alguém alterou esta despesa enquanto você decidia. Recarregue.</Alert>}
        {m.erroBloco && <Alert tone="danger">{m.erroBloco}</Alert>}
        <p className={s.impacto}>
          {despesa.descricao} · {formatarDinheiro(despesa.valor)} · vencimento {formatarData(despesa.vencimento)}
        </p>
        {m.precisaMotivo && <MotivoField value={m.motivo} onChange={m.setMotivo} erro={m.erros.motivo} />}
      </div>
    </Modal>
  );
}
