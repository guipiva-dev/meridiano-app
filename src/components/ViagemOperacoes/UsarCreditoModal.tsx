import { useState } from "react";
import type { CreditoDto, ViagemDto } from "@/api/viagens";
import { viagensApi } from "@/api/viagens";
import { Button, Field, Radio, Select } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { formatarData } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";
import s from "./Operacoes.module.css";
import { useOperacao } from "./useOperacao";

interface UsarCreditoModalProps {
  open: boolean;
  viagem: ViagemDto;
  creditos: CreditoDto[];
  onClose: () => void;
  onUsado: (v: ViagemDto) => void;
}

interface ConsumirReq {
  creditoId: string;
  reservaId: string;
  versao: string;
}

export function UsarCreditoModal({ open, viagem, creditos, onClose, onUsado }: UsarCreditoModalProps) {
  const [creditoId, setCreditoId] = useState("");
  const [reservaId, setReservaId] = useState("");
  const [erroLocal, setErroLocal] = useState<string>();
  const { salvando, erroBloco, conflito, enviar, limpar } = useOperacao<ConsumirReq>(
    (req) => viagensApi.consumirCredito(viagem.id, req.creditoId, req.reservaId, req.versao),
    {},
  );

  const disponiveis = creditos.filter((c) => c.status === "disponivel");
  const creditoSelecionado = disponiveis.find((c) => c.id === creditoId);
  const reservasElegiveis = viagem.reservas.filter(
    (r) => r.status !== "cancelada" && r.fornecedorId === creditoSelecionado?.fornecedorId,
  );

  function fechar() {
    setCreditoId("");
    setReservaId("");
    setErroLocal(undefined);
    limpar();
    onClose();
  }

  function escolherCredito(id: string) {
    setCreditoId(id);
    setReservaId("");
  }

  async function enviarForm() {
    if (!creditoId || !reservaId) {
      setErroLocal("Escolha o crédito e a reserva de destino");
      return;
    }
    setErroLocal(undefined);
    const dto = await enviar({ creditoId, reservaId, versao: viagem.versao });
    if (dto) {
      onUsado(dto);
      fechar();
    }
  }

  return (
    <Modal
      open={open}
      title="Usar crédito"
      onClose={fechar}
      footer={
        <>
          <Button variant="tertiary" onClick={fechar}>
            Voltar
          </Button>
          <Button
            variant="primary"
            loading={salvando}
            onClick={() => {
              void enviarForm();
            }}
          >
            Usar crédito
          </Button>
        </>
      }
    >
      <div className={s.grid}>
        {conflito && (
          <Alert tone="danger">Alguém alterou esta viagem enquanto você decidia. Recarregue e tente de novo.</Alert>
        )}
        {erroBloco && <Alert tone="danger">{erroBloco}</Alert>}
        {erroLocal && <Alert tone="danger">{erroLocal}</Alert>}
        <div role="radiogroup" aria-label="Créditos disponíveis" className={s.lista}>
          {disponiveis.map((c) => (
            <div key={c.id} className={s.creditoLinha}>
              <Radio
                label={`${c.clienteNome} · ${c.fornecedorNome} · ${formatarDinheiro(c.valor)} · ${
                  c.validade ? formatarData(c.validade) : "sem validade"
                }`}
                name="credito"
                value={c.id}
                checked={creditoId === c.id}
                onChange={() => {
                  escolherCredito(c.id);
                }}
              />
            </div>
          ))}
        </div>
        <Field label="Aplicar na reserva" required>
          <Select
            options={reservasElegiveis.map((r) => ({
              value: r.id,
              label: `${r.fornecedorNome} · ${r.localizador ?? "sem localizador"}`,
            }))}
            placeholder="Selecionar"
            value={reservaId}
            disabled={!creditoSelecionado}
            onChange={(e) => {
              setReservaId(e.target.value);
            }}
          />
        </Field>
      </div>
    </Modal>
  );
}
