import { useState } from "react";
import type { FormaPagamentoFin, MovimentoDto, MovimentoRequest, TipoMovimento } from "@/api/financeiro";
import { financeiroApi, TIPOS_MOVIMENTO } from "@/api/financeiro";
import type { ViagemDto } from "@/api/viagens";
import { Button, DateInput, Field, MoneyInput, Select, Textarea } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { apresentacaoStatus } from "@/dominio/status";
import { hojeIso } from "@/lib/datas";
import s from "./Financeiro.module.css";
import { MotivoField } from "./MotivoField";
import { CAMPO_POR_CODIGO_FIN } from "./mapaErrosFinanceiro";
import { OPCOES_FORMA } from "./ReceberModal";
import { useMutacaoFinanceira } from "./useMutacaoFinanceira";

interface MovimentoModalProps {
  open: boolean;
  viagem: ViagemDto;
  movimento?: MovimentoDto;
  reservaFixa?: string;
  onClose: () => void;
  onSalvo: (m: MovimentoDto) => void;
}

const OPCOES_TIPO = TIPOS_MOVIMENTO.map((t) => ({ value: t, label: apresentacaoStatus("movimento_tipo", t).texto }));

export function MovimentoModal({ open, viagem, movimento, reservaFixa, onClose, onSalvo }: MovimentoModalProps) {
  // Canceladas só entram quando a comissão foi mantida — as demais não recebem mais movimento.
  const reservas = viagem.reservas.filter((r) => r.status !== "cancelada" || r.comissaoMantida);
  const [reservaId, setReservaId] = useState(movimento?.reservaId ?? reservaFixa ?? reservas[0]?.id ?? "");
  const [tipo, setTipo] = useState<TipoMovimento>(movimento?.tipo ?? "recebimento_operadora");
  const [valor, setValor] = useState<number | null>(movimento ? Math.abs(movimento.valor) : null);
  const [data, setData] = useState(movimento?.dataMovimento ?? hojeIso());
  const [forma, setForma] = useState<FormaPagamentoFin | "">(movimento?.formaPagamento ?? "");
  const [observacao, setObservacao] = useState(movimento?.observacao ?? "");
  const m = useMutacaoFinanceira<MovimentoRequest, MovimentoDto>(
    (req, motivo) =>
      movimento ? financeiroApi.corrigir(movimento.id, req, motivo) : financeiroApi.lancar(req, motivo),
    CAMPO_POR_CODIGO_FIN,
  );

  function fechar() {
    m.limpar();
    onClose();
  }

  async function enviarForm() {
    const dto = await m.enviar({
      reservaId,
      tipo,
      valor: Math.abs(valor ?? 0),
      dataMovimento: data,
      formaPagamento: forma === "" ? null : forma,
      observacao: observacao.trim() || null,
      versao: movimento?.versao,
    });
    if (dto) {
      onSalvo(dto);
      fechar();
    }
  }

  const opcoesReserva = reservas.map((r) => ({
    value: r.id,
    label: `${r.fornecedorNome} · ${r.localizador ?? "sem localizador"}`,
  }));

  return (
    <Modal
      open={open}
      title={movimento ? "Corrigir movimento" : `Lançar movimento · ${viagem.codigo}`}
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
            {movimento ? "Salvar correção" : "Lançar movimento"}
          </Button>
        </>
      }
    >
      <div className={s.grid}>
        {m.conflito && <Alert tone="danger">Alguém alterou este movimento enquanto você editava. Recarregue.</Alert>}
        {m.erroBloco && <Alert tone="danger">{m.erroBloco}</Alert>}
        <Field label="Reserva" required>
          <Select
            options={opcoesReserva}
            value={reservaId}
            disabled={Boolean(movimento) || Boolean(reservaFixa)}
            onChange={(e) => {
              setReservaId(e.target.value);
            }}
          />
        </Field>
        <Field label="Tipo" required error={m.erros.tipo}>
          <Select
            options={OPCOES_TIPO}
            value={tipo}
            disabled={Boolean(movimento)}
            onChange={(e) => {
              setTipo(e.target.value as TipoMovimento);
            }}
          />
        </Field>
        <Field label="Valor" required helper="Saídas são gravadas como negativo" error={m.erros.valor}>
          <MoneyInput value={valor} onChange={setValor} />
        </Field>
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
            placeholder="—"
            value={forma}
            onChange={(e) => {
              setForma(e.target.value as FormaPagamentoFin | "");
            }}
          />
        </Field>
        <Field label="Observação">
          <Textarea
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
