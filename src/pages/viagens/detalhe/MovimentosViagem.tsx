import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { MovimentoDto } from "@/api/financeiro";
import { chavesFinanceiro, financeiroApi } from "@/api/financeiro";
import type { ViagemDto } from "@/api/viagens";
import { Button, MoneyValue } from "@/components";
import { StatusBadge } from "@/components/display";
import { ExcluirMovimentoModal, MovimentoModal } from "@/components/financeiro";
import { MenuAcoes } from "@/components/Menu/MenuAcoes";
import { apresentacaoStatus } from "@/dominio/status";
import { formatarData } from "@/lib/datas";
import fs from "./FinanceiroTab.module.css";
import { Bloco } from "./ResumoTab";
import s from "./Viagem.module.css";

type ModalMovimento =
  | { tipo: "lancar" }
  | { tipo: "editar"; movimento: MovimentoDto }
  | { tipo: "excluir"; movimento: MovimentoDto };

interface MovimentosViagemProps {
  viagem: ViagemDto;
  podeMovimentar: boolean;
  verValores: boolean;
  onMudou: () => void;
}

/** Movimentos de caixa da viagem (R10): lançar, corrigir e excluir com efeito no saldo/repasse. */
export function MovimentosViagem({ viagem, podeMovimentar, verValores, onMudou }: MovimentosViagemProps) {
  const [modal, setModal] = useState<ModalMovimento | undefined>();
  const q = useQuery({
    queryKey: chavesFinanceiro.movimentosDaViagem(viagem.id),
    queryFn: () => financeiroApi.movimentosDaViagem(viagem.id),
    enabled: verValores,
  });
  const movimentos = q.data ?? [];

  function fechar() {
    setModal(undefined);
  }
  function salvo() {
    fechar();
    onMudou();
  }

  return (
    <Bloco
      titulo="Movimentos"
      meta={
        <span className={fs.acoesTopo}>
          {movimentos.length}
          {podeMovimentar && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setModal({ tipo: "lancar" });
              }}
            >
              + Lançar movimento
            </Button>
          )}
        </span>
      }
    >
      {movimentos.length === 0 && <p className={s.vazio}>Nenhum movimento ainda</p>}
      {movimentos.map((mv) => (
        <div key={mv.id} className={s.linha}>
          <StatusBadge entidade="movimento_tipo" valor={mv.tipo} />
          <span className={s.linhaTexto}>
            <span className={s.linhaMeta}>
              {formatarData(mv.dataMovimento)}
              {mv.formaPagamento && ` · ${apresentacaoStatus("forma_pagamento_despesa", mv.formaPagamento).texto}`}
              {` · reserva ${mv.localizador ?? "—"}`}
            </span>
            {mv.observacao && <span className={s.linhaMeta}>{mv.observacao}</span>}
          </span>
          <MoneyValue value={mv.valor} className={s.linhaValor} />
          {podeMovimentar && (
            <>
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => {
                  setModal({ tipo: "editar", movimento: mv });
                }}
              >
                Editar
              </Button>
              <MenuAcoes
                label={`Mais ações do movimento em ${formatarData(mv.dataMovimento)}`}
                itens={[
                  {
                    label: "Excluir",
                    tone: "danger",
                    onClick: () => {
                      setModal({ tipo: "excluir", movimento: mv });
                    },
                  },
                ]}
              />
            </>
          )}
        </div>
      ))}

      {modal?.tipo === "lancar" && <MovimentoModal open viagem={viagem} onClose={fechar} onSalvo={salvo} />}
      {modal?.tipo === "editar" && (
        <MovimentoModal open viagem={viagem} movimento={modal.movimento} onClose={fechar} onSalvo={salvo} />
      )}
      {modal?.tipo === "excluir" && (
        <ExcluirMovimentoModal open movimento={modal.movimento} onClose={fechar} onExcluido={salvo} />
      )}
    </Bloco>
  );
}
