import { type ChangeEvent, useState } from "react";
import type { CancelarReservaRequest, ReservaDto, ViagemDto } from "@/api/viagens";
import { viagensApi } from "@/api/viagens";
import { Button, Field, useField } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { DesfechoFields, type DesfechoValue } from "./DesfechoFields";
import s from "./Operacoes.module.css";
import { useOperacao } from "./useOperacao";

interface CancelarReservaModalProps {
  open: boolean;
  reserva: ReservaDto;
  viagem: ViagemDto;
  onClose: () => void;
  onCancelada: (v: ViagemDto) => void;
  onRecarregar?: () => void;
}

const MAPA: Record<string, string> = {
  motivo_obrigatorio: "motivo",
  desfecho_invalido: "desfecho",
  valor_invalido: "valorReembolso",
  credito_valor_invalido: "credito.valor",
  credito_cliente_invalido: "credito.clienteId",
};

const DESFECHO_PADRAO: DesfechoValue = {
  desfecho: "sem_reembolso",
  valorReembolso: null,
  comissaoMantida: false,
  credito: null,
};

function Motivo({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const f = useField();
  return (
    <textarea
      id={f?.id}
      aria-describedby={f?.describedBy}
      aria-invalid={f?.invalid ? true : undefined}
      rows={3}
      className={s.textarea}
      value={value}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
      }}
    />
  );
}

export function CancelarReservaModal({
  open,
  reserva,
  viagem,
  onClose,
  onCancelada,
  onRecarregar,
}: CancelarReservaModalProps) {
  const [motivo, setMotivo] = useState("");
  const [desfecho, setDesfecho] = useState<DesfechoValue>(DESFECHO_PADRAO);
  const [erroMotivoLocal, setErroMotivoLocal] = useState<string>();
  const { salvando, erros, erroBloco, conflito, enviar, limpar } = useOperacao<CancelarReservaRequest>(
    (req) => viagensApi.cancelarReserva(reserva.id, req),
    MAPA,
  );

  function fechar() {
    setMotivo("");
    setDesfecho(DESFECHO_PADRAO);
    setErroMotivoLocal(undefined);
    limpar();
    onClose();
  }

  async function enviarForm() {
    if (!motivo.trim()) {
      setErroMotivoLocal("Motivo é obrigatório");
      return;
    }
    setErroMotivoLocal(undefined);
    const req: CancelarReservaRequest = {
      motivo: motivo.trim(),
      desfecho: desfecho.desfecho,
      valorReembolso: desfecho.valorReembolso,
      comissaoMantida: desfecho.comissaoMantida,
      credito:
        desfecho.desfecho === "credito" && desfecho.credito
          ? {
              valor: desfecho.credito.valor ?? 0,
              validade: desfecho.credito.validade,
              clienteId: desfecho.credito.clienteId,
            }
          : null,
      versao: viagem.versao,
    };
    const dto = await enviar(req);
    if (dto) {
      onCancelada(dto);
      fechar();
    }
  }

  const indice = viagem.reservas.findIndex((r) => r.id === reserva.id) + 1;

  return (
    <Modal
      open={open}
      title={`Cancelar reserva ${indice} · ${reserva.fornecedorNome}`}
      onClose={fechar}
      footer={
        <>
          <Button variant="tertiary" onClick={fechar}>
            Voltar
          </Button>
          <Button
            variant="danger"
            loading={salvando}
            onClick={() => {
              void enviarForm();
            }}
          >
            Cancelar reserva
          </Button>
        </>
      }
    >
      <div className={s.grid}>
        {conflito && (
          <Alert
            tone="danger"
            action={
              onRecarregar ? (
                <Button variant="secondary" onClick={onRecarregar}>
                  Recarregar
                </Button>
              ) : undefined
            }
          >
            Alguém alterou esta viagem enquanto você decidia. Recarregue e tente de novo.
          </Alert>
        )}
        {erroBloco && <Alert tone="danger">{erroBloco}</Alert>}
        <p className={s.impacto}>Zera comissão prevista (salvo comissão mantida) e reavalia o repasse.</p>
        <Field label="Motivo" required error={erroMotivoLocal ?? erros.motivo}>
          <Motivo value={motivo} onChange={setMotivo} />
        </Field>
        <DesfechoFields value={desfecho} onChange={setDesfecho} erros={erros} passageiros={viagem.passageiros} />
      </div>
    </Modal>
  );
}
