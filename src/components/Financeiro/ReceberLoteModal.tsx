import { useState } from "react";
import type { ConciliacaoItemDto, FormaPagamentoFin, MovimentoDto } from "@/api/financeiro";
import { financeiroApi } from "@/api/financeiro";
import { Button, DateInput, Field, Select } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { hojeIso } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";
import s from "./Financeiro.module.css";
import { MotivoField } from "./MotivoField";
import { CAMPO_POR_CODIGO_FIN } from "./mapaErrosFinanceiro";
import { OPCOES_FORMA } from "./ReceberModal";
import { useMutacaoFinanceira } from "./useMutacaoFinanceira";

interface ReceberLoteModalProps {
  open: boolean;
  itens: ConciliacaoItemDto[];
  onClose: () => void;
  onRecebido: (ms: MovimentoDto[]) => void;
}

interface ArgsLote {
  dataMovimento: string;
  formaPagamento: FormaPagamentoFin;
}

export function ReceberLoteModal({ open, itens, onClose, onRecebido }: ReceberLoteModalProps) {
  const [data, setData] = useState(hojeIso());
  const [forma, setForma] = useState<FormaPagamentoFin>("transferencia");
  const m = useMutacaoFinanceira<ArgsLote, { movimentos: MovimentoDto[] }>(
    (args, motivo) =>
      financeiroApi.receberLote(
        itens.map((i) => i.reservaId),
        args.dataMovimento,
        args.formaPagamento,
        motivo,
      ),
    CAMPO_POR_CODIGO_FIN,
  );

  function fechar() {
    setData(hojeIso());
    setForma("transferencia");
    m.limpar();
    onClose();
  }

  async function enviarForm() {
    const dto = await m.enviar({ dataMovimento: data, formaPagamento: forma });
    if (dto) {
      onRecebido(dto.movimentos);
      fechar();
    }
  }

  const soma = itens.reduce((total, i) => total + i.saldo, 0);

  return (
    <Modal
      open={open}
      title={`Marcar ${itens.length} comissões como recebidas`}
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
            Confirmar {formatarDinheiro(soma)}
          </Button>
        </>
      }
    >
      <div className={s.grid}>
        {m.conflito && <Alert tone="danger">Alguma reserva mudou enquanto você decidia. Recarregue.</Alert>}
        {m.erroBloco && <Alert tone="danger">{m.erroBloco}</Alert>}
        <ul className={s.lista}>
          {itens.map((i) => (
            <li key={i.reservaId} className={s.linha}>
              {i.fornecedorNome} · {i.localizador ?? "sem localizador"}{" "}
              <span className={s.meta}>({formatarDinheiro(i.esperado)})</span>
            </li>
          ))}
        </ul>
        <Field label="Data" required error={m.erros.data}>
          <DateInput
            value={data}
            onChange={(e) => {
              setData(e.target.value);
            }}
          />
        </Field>
        <Field label="Forma" error={m.erros.formaPagamento}>
          <Select
            options={OPCOES_FORMA}
            value={forma}
            onChange={(e) => {
              setForma(e.target.value as FormaPagamentoFin);
            }}
          />
        </Field>
        {m.precisaMotivo && <MotivoField value={m.motivo} onChange={m.setMotivo} erro={m.erros.motivo} />}
      </div>
    </Modal>
  );
}
