import { type ChangeEvent, useState } from "react";
import type { CancelarReservaItem, CancelarViagemRequest, ViagemDto } from "@/api/viagens";
import { viagensApi } from "@/api/viagens";
import { Button, Field, useField } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { DesfechoFields, type DesfechoValue } from "./DesfechoFields";
import s from "./Operacoes.module.css";
import { useOperacao } from "./useOperacao";

interface CancelarViagemModalProps {
  open: boolean;
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

export function CancelarViagemModal({ open, viagem, onClose, onCancelada, onRecarregar }: CancelarViagemModalProps) {
  const [motivo, setMotivo] = useState("");
  const [desfechos, setDesfechos] = useState<Record<string, DesfechoValue>>({});
  const [erroMotivoLocal, setErroMotivoLocal] = useState<string>();
  const { salvando, erros, erroBloco, conflito, enviar, limpar } = useOperacao<CancelarViagemRequest>(
    (req) => viagensApi.cancelarViagem(viagem.id, req),
    MAPA,
  );

  const ativos = viagem.reservas.filter((r) => r.status !== "cancelada");

  function fechar() {
    setMotivo("");
    setDesfechos({});
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
    const reservas: CancelarReservaItem[] = ativos.map((r) => {
      const d = desfechos[r.id] ?? DESFECHO_PADRAO;
      return {
        reservaId: r.id,
        desfecho: d.desfecho,
        valorReembolso: d.valorReembolso,
        comissaoMantida: d.comissaoMantida,
        credito:
          d.desfecho === "credito" && d.credito
            ? { valor: d.credito.valor ?? 0, validade: d.credito.validade, clienteId: d.credito.clienteId }
            : null,
      };
    });
    const dto = await enviar({ motivo: motivo.trim(), reservas, versao: viagem.versao });
    if (dto) {
      onCancelada(dto);
      fechar();
    }
  }

  const n = ativos.length;
  const rotuloReservas = n === 1 ? "reserva" : "reservas";
  const rotuloBotao = n === 0 ? "Cancelar viagem" : `Cancelar viagem e ${n} ${rotuloReservas}`;
  const textoImpacto =
    n === 0
      ? "Não há reservas ativas; cancela as pendências automáticas."
      : `Cancela ${n} ${rotuloReservas} ativas e as pendências automáticas.`;

  return (
    <Modal
      open={open}
      title={`Cancelar viagem ${viagem.codigo}`}
      onClose={fechar}
      size="lg"
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
            {rotuloBotao}
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
        <p className={s.impacto}>{textoImpacto}</p>
        <Field label="Motivo" required error={erroMotivoLocal ?? erros.motivo}>
          <Motivo value={motivo} onChange={setMotivo} />
        </Field>
        <div className={s.lista}>
          {ativos.map((r) => (
            <div key={r.id} className={s.item}>
              <span className={s.itemHeader}>{`${r.fornecedorNome} · ${r.localizador ?? "sem localizador"}`}</span>
              <DesfechoFields
                value={desfechos[r.id] ?? DESFECHO_PADRAO}
                onChange={(v) => {
                  setDesfechos((prev) => ({ ...prev, [r.id]: v }));
                }}
                erros={erros}
                passageiros={viagem.passageiros}
              />
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
