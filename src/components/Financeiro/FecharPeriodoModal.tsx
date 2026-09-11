import type { PeriodoDto } from "@/api/fechamento";
import { fechamentoApi } from "@/api/fechamento";
import type { ConciliacaoItemDto } from "@/api/financeiro";
import { Button } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { nomeMes } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";
import s from "./Financeiro.module.css";
import { CAMPO_POR_CODIGO_FIN } from "./mapaErrosFinanceiro";
import { useMutacaoFinanceira } from "./useMutacaoFinanceira";

interface FecharPeriodoModalProps {
  open: boolean;
  periodo: PeriodoDto;
  /** Já carregadas pela página: o modal não busca nada. */
  pendentes: ConciliacaoItemDto[];
  onClose: () => void;
  onFechado: (p: PeriodoDto) => void;
}

export function FecharPeriodoModal({ open, periodo, pendentes, onClose, onFechado }: FecharPeriodoModalProps) {
  const m = useMutacaoFinanceira<undefined, PeriodoDto>(
    () => fechamentoApi.fechar(periodo.competencia),
    CAMPO_POR_CODIGO_FIN,
  );

  function fechar() {
    m.limpar();
    onClose();
  }

  async function enviarForm() {
    const dto = await m.enviar(undefined);
    if (dto) {
      onFechado(dto);
      fechar();
    }
  }

  const mes = nomeMes(periodo.competencia);
  const valorPendente = pendentes.reduce((soma, p) => soma + p.saldo, 0);

  return (
    <Modal
      open={open}
      title={`Fechar ${mes}?`}
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
            Fechar {mes}
          </Button>
        </>
      }
    >
      <div className={s.grid}>
        {m.conflito && <Alert tone="danger">O período mudou enquanto você decidia. Recarregue.</Alert>}
        {m.erroBloco && <Alert tone="danger">{m.erroBloco}</Alert>}
        <p className={s.impacto}>
          {pendentes.length} comissões pendentes ({formatarDinheiro(valorPendente)}) continuam em aberto na conciliação.
          Depois do fechamento, reservas compradas em {mes}, movimentos, despesas e repasses pagos em {mes} só mudam com
          permissão e motivo.
        </p>
        {pendentes.length > 0 && (
          <ul className={s.lista}>
            {pendentes.map((p) => (
              <li key={p.reservaId} className={s.linha}>
                {p.fornecedorNome} · {p.localizador ?? "sem localizador"}{" "}
                <span className={s.meta}>({formatarDinheiro(p.saldo)})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
