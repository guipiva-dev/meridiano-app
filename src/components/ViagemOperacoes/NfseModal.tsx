import { useState } from "react";
import type { NfseRequest, ReservaDto, ViagemDto } from "@/api/viagens";
import { viagensApi } from "@/api/viagens";
import { Button, DateInput, Field, Input, Select } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { hojeIso } from "@/lib/datas";
import s from "./Operacoes.module.css";
import { useOperacao } from "./useOperacao";

interface NfseModalProps {
  open: boolean;
  reserva: ReservaDto;
  viagem: ViagemDto;
  onClose: () => void;
  onSalva: (v: ViagemDto) => void;
  onRecarregar?: () => void;
}

// `nfse_incompleta` fala de número, data e tomador de uma vez: fica no bloco, não sob um campo.
const MAPA: Record<string, string> = {
  nfse_invalida: "status",
  nfse_data_futura: "dataEmissao",
};

const OPCOES_STATUS = [
  { value: "falta_emitir", label: "Falta emitir" },
  { value: "emitido", label: "Emitida" },
  { value: "nao_precisa", label: "Não precisa" },
];
const OPCOES_TOMADOR = [
  { value: "cliente", label: "Cliente" },
  { value: "operadora", label: "Operadora" },
];

export function NfseModal({ open, reserva, viagem, onClose, onSalva, onRecarregar }: NfseModalProps) {
  const [status, setStatus] = useState(reserva.nfseStatus);
  const [tomador, setTomador] = useState<"cliente" | "operadora" | "">(reserva.nfseTomador ?? "");
  const [numero, setNumero] = useState(reserva.nfseNumero ?? "");
  const [dataEmissao, setDataEmissao] = useState(reserva.nfseDataEmissao ?? "");
  const [erroTomadorLocal, setErroTomadorLocal] = useState<string>();
  const [erroNumeroLocal, setErroNumeroLocal] = useState<string>();
  const [erroDataLocal, setErroDataLocal] = useState<string>();
  const { salvando, erros, erroBloco, conflito, enviar, limpar } = useOperacao<NfseRequest>(
    (req) => viagensApi.nfse(reserva.id, req),
    MAPA,
  );

  function fechar() {
    setStatus(reserva.nfseStatus);
    setTomador(reserva.nfseTomador ?? "");
    setNumero(reserva.nfseNumero ?? "");
    setDataEmissao(reserva.nfseDataEmissao ?? "");
    setErroTomadorLocal(undefined);
    setErroNumeroLocal(undefined);
    setErroDataLocal(undefined);
    limpar();
    onClose();
  }

  async function enviarForm() {
    if (status === "emitido" && tomador === "") {
      setErroTomadorLocal("Tomador é obrigatório para NFSe emitida");
      return;
    }
    setErroTomadorLocal(undefined);
    if (status === "emitido" && !numero.trim()) {
      setErroNumeroLocal("Número é obrigatório para NFSe emitida");
      return;
    }
    setErroNumeroLocal(undefined);
    if (status === "emitido" && dataEmissao && dataEmissao > hojeIso()) {
      setErroDataLocal("Data de emissão não pode ser no futuro");
      return;
    }
    setErroDataLocal(undefined);
    const req: NfseRequest = {
      status,
      tomador: tomador === "" ? null : tomador,
      numero: numero.trim() || null,
      dataEmissao: dataEmissao || null,
      versao: viagem.versao,
    };
    const dto = await enviar(req);
    if (dto) {
      onSalva(dto);
      fechar();
    }
  }

  const indice = viagem.reservas.findIndex((r) => r.id === reserva.id) + 1;

  return (
    <Modal
      open={open}
      title={`NFSe · reserva ${indice} · ${reserva.fornecedorNome}`}
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
            Salvar
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
        <Field label="Status" error={erros.status}>
          <Select
            options={OPCOES_STATUS}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as NfseRequest["status"]);
            }}
          />
        </Field>
        <Field label="Tomador" required={status === "emitido"} error={erroTomadorLocal}>
          <Select
            options={OPCOES_TOMADOR}
            placeholder="Selecionar"
            value={tomador}
            onChange={(e) => {
              setTomador(e.target.value as "cliente" | "operadora" | "");
            }}
          />
        </Field>
        <Field label="Número" error={erroNumeroLocal ?? erros.numero}>
          <Input
            className={s.mono}
            value={numero}
            onChange={(e) => {
              setNumero(e.target.value);
            }}
          />
        </Field>
        <Field label="Emissão" error={erroDataLocal ?? erros.dataEmissao}>
          <DateInput
            max={hojeIso()}
            value={dataEmissao}
            onChange={(e) => {
              setDataEmissao(e.target.value);
            }}
          />
        </Field>
      </div>
    </Modal>
  );
}
