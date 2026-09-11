import { X } from "lucide-react";
import { useState } from "react";
import { type FornecedorDetalheDto, fornecedoresApi, type JanelaDto } from "@/api/fornecedores";
import { Button, DateInput, Field, IconButton, Input } from "@/components";
import { errosDeCadastro } from "@/components/Cadastros/mapaErrosCadastro";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { hojeIso } from "@/lib/datas";
import s from "./Fornecedores.module.css";

interface LinhaJanela {
  diaInicial: string;
  diaFinal: string;
  diaPagamento: string;
  mesesAFrente: string;
}

const LINHA_VAZIA: LinhaJanela = { diaInicial: "", diaFinal: "", diaPagamento: "", mesesAFrente: "0" };
const COLUNAS: { chave: keyof LinhaJanela; titulo: string; min: number; max: number }[] = [
  { chave: "diaInicial", titulo: "Dia inicial", min: 1, max: 31 },
  { chave: "diaFinal", titulo: "Dia final", min: 1, max: 31 },
  { chave: "diaPagamento", titulo: "Dia do pagamento", min: 1, max: 31 },
  { chave: "mesesAFrente", titulo: "Meses à frente", min: 0, max: 3 },
];

/** Validação local antes do POST: erra rápido em vez de gastar um round-trip com 422. */
function validar(linhas: LinhaJanela[]): { janelas: JanelaDto[] } | { erro: string } {
  if (linhas.length === 0) return { erro: "Cadastre pelo menos uma janela." };
  const janelas: JanelaDto[] = [];
  for (const [i, l] of linhas.entries()) {
    const n = i + 1;
    const diaInicial = Number(l.diaInicial);
    const diaFinal = Number(l.diaFinal);
    const diaPagamento = Number(l.diaPagamento);
    const mesesAFrente = Number(l.mesesAFrente);
    if ([diaInicial, diaFinal, diaPagamento].some((d) => !Number.isInteger(d) || d < 1 || d > 31)) {
      return { erro: `Na janela ${n}, preencha dias entre 1 e 31.` };
    }
    if (diaFinal < diaInicial) return { erro: `Na janela ${n}, o dia final não pode ser menor que o dia inicial.` };
    if (!Number.isInteger(mesesAFrente) || mesesAFrente < 0 || mesesAFrente > 3) {
      return { erro: `Na janela ${n}, meses à frente vai de 0 a 3.` };
    }
    janelas.push({ diaInicial, diaFinal, diaPagamento, mesesAFrente });
  }
  return { janelas };
}

interface NovaVersaoRegraModalProps {
  open: boolean;
  fornecedorId: string;
  onClose: () => void;
  onSalva: (f: FornecedorDetalheDto) => void;
}

export function NovaVersaoRegraModal({ open, fornecedorId, onClose, onSalva }: NovaVersaoRegraModalProps) {
  const [vigenteDesde, setVigenteDesde] = useState(hojeIso());
  const [linhas, setLinhas] = useState<LinhaJanela[]>([LINHA_VAZIA]);
  const [erroData, setErroData] = useState<string | undefined>(undefined);
  const [erroBloco, setErroBloco] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function fechar() {
    setVigenteDesde(hojeIso());
    setLinhas([LINHA_VAZIA]);
    setErroData(undefined);
    setErroBloco(null);
    setSalvando(false);
    onClose();
  }

  function alterar(indice: number, chave: keyof LinhaJanela, valor: string) {
    setLinhas((atuais) => atuais.map((l, i) => (i === indice ? { ...l, [chave]: valor } : l)));
  }

  async function enviar() {
    setErroData(undefined);
    setErroBloco(null);
    if (!vigenteDesde) {
      setErroData("Informe a data de início da vigência");
      return;
    }
    const validado = validar(linhas);
    if ("erro" in validado) {
      setErroBloco(validado.erro);
      return;
    }
    setSalvando(true);
    try {
      const salvo = await fornecedoresApi.novaVersaoRegra(fornecedorId, {
        vigenteDesde,
        janelas: validado.janelas,
      });
      onSalva(salvo);
      fechar();
    } catch (erro) {
      const r = errosDeCadastro(erro);
      setErroData(r.campos.vigenteDesde);
      setErroBloco(
        r.campos.janelas ?? (r.conflito ? "Alguém alterou este fornecedor enquanto você editava." : r.bloco),
      );
      setSalvando(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Nova versão da regra"
      size="lg"
      onClose={fechar}
      footer={
        <>
          <Button variant="tertiary" onClick={fechar}>
            Fechar
          </Button>
          <Button
            variant="primary"
            loading={salvando}
            onClick={() => {
              void enviar();
            }}
          >
            Salvar
          </Button>
        </>
      }
    >
      <div className={s.formModal}>
        {erroBloco && <Alert tone="danger">{erroBloco}</Alert>}
        <Field
          label="Vigente a partir de"
          required
          helper="Reservas já lançadas mantêm a previsão gravada."
          error={erroData}
        >
          <DateInput
            value={vigenteDesde}
            onChange={(e) => {
              setVigenteDesde(e.target.value);
            }}
          />
        </Field>

        <table className={s.tabelaJanelas}>
          <caption className={s.meta}>Janelas de compra e o dia em que a operadora paga cada uma</caption>
          <thead>
            <tr>
              {COLUNAS.map((c) => (
                <th key={c.chave}>{c.titulo}</th>
              ))}
              <th className={s.colRemover} />
            </tr>
          </thead>
          <tbody>
            {/* A posição é a identidade da janela: não há id e a ordem é o que o usuário edita. */}
            {linhas.map((l, i) => (
              <tr key={i}>
                {COLUNAS.map((c) => (
                  <td key={c.chave}>
                    <Input
                      type="number"
                      min={c.min}
                      max={c.max}
                      aria-label={`${c.titulo} da janela ${i + 1}`}
                      value={l[c.chave]}
                      onChange={(e) => {
                        alterar(i, c.chave, e.target.value);
                      }}
                    />
                  </td>
                ))}
                <td>
                  <IconButton
                    label={`Remover janela ${i + 1}`}
                    icon={<X size={16} />}
                    onClick={() => {
                      setLinhas((atuais) => atuais.filter((_, j) => j !== i));
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setLinhas((atuais) => [...atuais, LINHA_VAZIA]);
            }}
          >
            + Janela
          </Button>
        </div>
      </div>
    </Modal>
  );
}
