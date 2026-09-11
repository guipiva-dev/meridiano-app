import { useState } from "react";
import type { ConciliacaoItemDto, FormaPagamentoFin, MovimentoDto, MovimentoRequest } from "@/api/financeiro";
import { financeiroApi } from "@/api/financeiro";
import { Button, DateInput, Field, MoneyInput, Select } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { hojeIso } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";
import s from "./Financeiro.module.css";
import { MotivoField } from "./MotivoField";
import { CAMPO_POR_CODIGO_FIN, OPCOES_FORMA } from "./mapaErrosFinanceiro";
import { useMutacaoFinanceira } from "./useMutacaoFinanceira";

export type ItemRecebimento = Pick<
  ConciliacaoItemDto,
  "reservaId" | "fornecedorNome" | "localizador" | "esperado" | "recebido" | "saldo"
>;

interface ReceberModalProps {
  open: boolean;
  item: ItemRecebimento;
  onClose: () => void;
  onRecebido: (m: MovimentoDto) => void;
}

export function ReceberModal({ open, item, onClose, onRecebido }: ReceberModalProps) {
  const [valor, setValor] = useState<number | null>(item.saldo);
  const [data, setData] = useState(hojeIso());
  const [forma, setForma] = useState<FormaPagamentoFin>("transferencia");
  const m = useMutacaoFinanceira<MovimentoRequest, MovimentoDto>(
    (req, motivo) => financeiroApi.lancar(req, motivo),
    CAMPO_POR_CODIGO_FIN,
  );

  function fechar() {
    setValor(item.saldo);
    setData(hojeIso());
    setForma("transferencia");
    m.limpar();
    onClose();
  }

  async function enviarForm() {
    const dto = await m.enviar({
      reservaId: item.reservaId,
      tipo: "recebimento_operadora",
      valor: valor ?? 0,
      dataMovimento: data,
      formaPagamento: forma,
      observacao: null,
    });
    if (dto) {
      onRecebido(dto);
      fechar();
    }
  }

  const parcial = valor !== null && valor < item.saldo;

  return (
    <Modal
      open={open}
      title={`Receber comissão · ${item.fornecedorNome} · ${item.localizador ?? "sem localizador"}`}
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
            Confirmar recebimento
          </Button>
        </>
      }
    >
      <div className={s.grid}>
        {m.conflito && <Alert tone="danger">Alguém alterou esta reserva enquanto você decidia. Recarregue.</Alert>}
        {m.erroBloco && <Alert tone="danger">{m.erroBloco}</Alert>}
        <p className={s.impacto}>
          Esperado {formatarDinheiro(item.esperado)} · recebido {formatarDinheiro(item.recebido)}
        </p>
        <Field
          label="Valor recebido"
          required
          helper={`Esperado: ${formatarDinheiro(item.esperado)} · menor = parcial ou divergência`}
          error={m.erros.valor}
        >
          <MoneyInput value={valor} onChange={setValor} />
        </Field>
        {parcial && (
          <Alert tone="neutral">
            Valor menor que o esperado. Registre a diferença como divergência com motivo, ou deixe em aberto para
            receber o saldo depois.
          </Alert>
        )}
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
