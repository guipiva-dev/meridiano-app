import { useState } from "react";
import { descreverJanela, type FornecedorDetalheDto, type VersaoRegraDto } from "@/api/fornecedores";
import { Button } from "@/components";
import { Alert } from "@/components/display";
import { EmptyState } from "@/components/feedback";
import { Section } from "@/components/shell";
import { formatarData } from "@/lib/datas";
import s from "./Fornecedores.module.css";
import { NovaVersaoRegraModal } from "./NovaVersaoRegraModal";

function Janelas({ regra }: { regra: VersaoRegraDto }) {
  return (
    <ul className={s.janelas}>
      {regra.janelas.map((j) => {
        const { titulo, sub } = descreverJanela(j);
        return (
          <li key={`${j.diaInicial}-${j.diaFinal}-${j.diaPagamento}`} className={s.janela}>
            <span className={s.janelaTitulo}>{titulo}</span>
            <span className={s.secondary}>{sub}</span>
          </li>
        );
      })}
    </ul>
  );
}

interface RegrasTabProps {
  fornecedor: FornecedorDetalheDto;
  podeEditar: boolean;
  onMudou: (f: FornecedorDetalheDto) => void;
}

export function RegrasTab({ fornecedor, podeEditar, onMudou }: RegrasTabProps) {
  const [aberto, setAberto] = useState(false);
  const vigente = fornecedor.regraVigente;
  const anteriores = fornecedor.regras.filter((r) => r.vigenteDesde !== vigente?.vigenteDesde);

  return (
    <Section title="Quando paga a comissão" description="Define a data prevista de cada reserva na conciliação">
      <div className={s.blocoRegras}>
        {vigente ? (
          <>
            <Alert tone="neutral" title={`Regra vigente desde ${formatarData(vigente.vigenteDesde)}`}>
              Alterar cria uma nova versão válida a partir de uma data. Reservas já lançadas mantêm a previsão gravada.
            </Alert>
            <Janelas regra={vigente} />
            {fornecedor.prazoComissaoDias !== null && (
              <p className={s.meta}>ou prazo fixo: {fornecedor.prazoComissaoDias} dias após a compra</p>
            )}
          </>
        ) : (
          // Sem regra o texto do EmptyState já explica que a previsão cai no prazo em dias.
          <EmptyState
            title="Sem regra de pagamento"
            description="A previsão usa o prazo em dias (ou 30 dias). Cadastre janelas para prever pelo calendário da operadora."
          />
        )}

        {podeEditar && (
          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setAberto(true);
              }}
            >
              Nova versão da regra a partir de…
            </Button>
          </div>
        )}

        {anteriores.length > 0 && (
          <details className={s.anteriores}>
            <summary>Versões anteriores ({anteriores.length})</summary>
            {anteriores.map((r) => (
              <div key={r.vigenteDesde} className={s.versaoAntiga}>
                <p className={s.meta}>Vigente desde {formatarData(r.vigenteDesde)}</p>
                <Janelas regra={r} />
              </div>
            ))}
          </details>
        )}
      </div>

      <NovaVersaoRegraModal
        open={aberto}
        fornecedorId={fornecedor.id}
        onClose={() => {
          setAberto(false);
        }}
        onSalva={onMudou}
      />
    </Section>
  );
}
