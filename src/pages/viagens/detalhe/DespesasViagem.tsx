import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { DespesaDto } from "@/api/despesas";
import { chavesDespesas, despesasApi } from "@/api/despesas";
import { chaves, type ViagemDto, viagensApi } from "@/api/viagens";
import { Button, MoneyValue, StatusCell } from "@/components";
import { DespesaModal, ExcluirDespesaModal, PagarDespesaModal } from "@/components/financeiro";
import { MenuAcoes } from "@/components/Menu/MenuAcoes";
import { apresentacaoStatus } from "@/dominio/status";
import { formatarData } from "@/lib/datas";
import fs from "./FinanceiroTab.module.css";
import { Bloco } from "./ResumoTab";
import s from "./Viagem.module.css";

type ModalDespesa =
  | { tipo: "nova" }
  | { tipo: "editar"; despesa: DespesaDto }
  | { tipo: "pagar"; despesa: DespesaDto }
  | { tipo: "excluir"; despesa: DespesaDto };

interface DespesasViagemProps {
  viagem: ViagemDto;
  podeMovimentar: boolean;
  onMudou: () => void;
}

/** Despesas ligadas à viagem (R10): entram no resultado; lançar/editar/pagar/excluir daqui aplicam
 * a mesma regra de `pages/financeiro/despesas`, com a viagem fixa no lançamento. */
export function DespesasViagem({ viagem, podeMovimentar, onMudou }: DespesasViagemProps) {
  const [modal, setModal] = useState<ModalDespesa | undefined>();
  const q = useQuery({
    queryKey: chavesDespesas.daViagem(viagem.id),
    queryFn: () => despesasApi.listar({ viagemId: viagem.id }),
  });
  const fornecedoresQ = useQuery({ queryKey: chaves.fornecedores, queryFn: viagensApi.fornecedores });
  const itens = q.data?.itens ?? [];
  const viagemFixa = { id: viagem.id, rotulo: viagem.codigo };

  function fechar() {
    setModal(undefined);
  }
  function salva() {
    fechar();
    onMudou();
  }

  return (
    <Bloco
      titulo="Despesas da viagem"
      meta={
        <span className={fs.acoesTopo}>
          {q.data?.total ?? 0}
          {podeMovimentar && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setModal({ tipo: "nova" });
              }}
            >
              + Despesa
            </Button>
          )}
        </span>
      }
    >
      {itens.length === 0 && <p className={s.vazio}>Nenhuma despesa ligada a esta viagem</p>}
      {itens.map((d) => (
        <div key={d.id} className={s.linha}>
          <span className={s.linhaTexto}>
            <b className={s.linhaTitulo}>{d.descricao}</b>
            <span className={s.linhaMeta}>
              {apresentacaoStatus("despesa_categoria", d.categoria).texto} · vencimento {formatarData(d.vencimento)}
            </span>
          </span>
          <StatusCell entidade="despesa" valor={d.situacao} />
          <MoneyValue value={d.valor} className={s.linhaValor} />
          {podeMovimentar && !d.pago && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setModal({ tipo: "pagar", despesa: d });
              }}
            >
              Marcar pago
            </Button>
          )}
          {podeMovimentar && (
            <>
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => {
                  setModal({ tipo: "editar", despesa: d });
                }}
              >
                Editar
              </Button>
              <MenuAcoes
                label={`Mais ações de ${d.descricao}`}
                itens={[
                  {
                    label: "Excluir",
                    tone: "danger",
                    onClick: () => {
                      setModal({ tipo: "excluir", despesa: d });
                    },
                  },
                ]}
              />
            </>
          )}
        </div>
      ))}

      {modal?.tipo === "nova" && (
        <DespesaModal
          open
          viagemFixa={viagemFixa}
          fornecedores={fornecedoresQ.data ?? []}
          onClose={fechar}
          onSalva={salva}
        />
      )}
      {modal?.tipo === "editar" && (
        <DespesaModal
          open
          despesa={modal.despesa}
          viagemFixa={viagemFixa}
          fornecedores={fornecedoresQ.data ?? []}
          onClose={fechar}
          onSalva={salva}
        />
      )}
      {modal?.tipo === "pagar" && <PagarDespesaModal open despesa={modal.despesa} onClose={fechar} onPaga={salva} />}
      {modal?.tipo === "excluir" && (
        <ExcluirDespesaModal open despesa={modal.despesa} onClose={fechar} onExcluida={salva} />
      )}
    </Bloco>
  );
}
