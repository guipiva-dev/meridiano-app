import { useState } from "react";
import type { VendedorDto, ViagemDto } from "@/api/viagens";
import { viagensApi } from "@/api/viagens";
import { Button, Field, Select } from "@/components";
import { Alert } from "@/components/display";
import { Modal, toast } from "@/components/feedback";
import s from "./Operacoes.module.css";
import { useOperacao } from "./useOperacao";

interface TransferirModalProps {
  open: boolean;
  viagem: ViagemDto;
  vendedores: VendedorDto[];
  onClose: () => void;
  onTransferida: (v: ViagemDto) => void;
  onRecarregar?: () => void;
}

interface TransferirReq {
  agenteId: string;
  versao: string;
}

const MAPA: Record<string, string> = {
  agente_igual: "agenteId",
  usuario_inativo: "agenteId",
};

export function TransferirModal({
  open,
  viagem,
  vendedores,
  onClose,
  onTransferida,
  onRecarregar,
}: TransferirModalProps) {
  const [agenteId, setAgenteId] = useState("");
  const [erroAgenteLocal, setErroAgenteLocal] = useState<string>();
  const { salvando, erros, erroBloco, conflito, enviar, limpar } = useOperacao<TransferirReq>(
    (req) => viagensApi.transferir(viagem.id, req.agenteId, req.versao),
    MAPA,
  );

  const opcoes = vendedores.filter((v) => v.id !== viagem.agenteId).map((v) => ({ value: v.id, label: v.nome }));

  function fechar() {
    setAgenteId("");
    setErroAgenteLocal(undefined);
    limpar();
    onClose();
  }

  async function enviarForm() {
    if (!agenteId) {
      setErroAgenteLocal("Selecione o novo agente");
      return;
    }
    setErroAgenteLocal(undefined);
    const dto = await enviar({ agenteId, versao: viagem.versao });
    if (dto) {
      toast.success("Viagem transferida.");
      onTransferida(dto);
      fechar();
    }
  }

  return (
    <Modal
      open={open}
      title="Transferir viagem"
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
            Transferir
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
        <Field label="Novo agente" required error={erroAgenteLocal ?? erros.agenteId}>
          <Select
            options={opcoes}
            placeholder="Selecionar"
            value={agenteId}
            onChange={(e) => {
              setAgenteId(e.target.value);
            }}
          />
        </Field>
      </div>
    </Modal>
  );
}
