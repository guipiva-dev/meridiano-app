import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { mensagemDeErro } from "@/api/errors";
import { chavesFornecedores, fornecedoresApi, type ReservaDoFornecedorDto } from "@/api/fornecedores";
import { type Coluna, DataTable, DateCell, MoneyCell, Paginacao, StatusCell } from "@/components";
import { Alert } from "@/components/display";
import { EmptyState } from "@/components/feedback";
import s from "./Fornecedores.module.css";

export function ReservasFornecedorTab({ fornecedorId }: { fornecedorId: string }) {
  const nav = useNavigate();
  const [pagina, setPagina] = useState(1);
  const reservasQ = useQuery({
    queryKey: chavesFornecedores.reservas(fornecedorId, pagina),
    queryFn: () => fornecedoresApi.reservas(fornecedorId, pagina),
    placeholderData: keepPreviousData,
  });

  const itens = reservasQ.data?.itens ?? [];
  const mostrarValores = itens[0]?.venda !== undefined;

  const colunas = useMemo<Coluna<ReservaDoFornecedorDto>[]>(() => {
    const base: Coluna<ReservaDoFornecedorDto>[] = [
      {
        id: "reserva",
        titulo: "Reserva",
        render: (r) => (
          <div>
            <div className={s.primary}>
              {r.titular ?? "—"} · {r.destino}
            </div>
            <div className={s.secondary}>
              <code>{r.codigo}</code>
              {r.localizador && (
                <>
                  {" · "}
                  <code>{r.localizador}</code>
                </>
              )}
            </div>
          </div>
        ),
      },
      { id: "compra", titulo: "Compra", render: (r) => <DateCell value={r.dataCompra} /> },
      {
        id: "situacao",
        titulo: "Situação",
        render: (r) => <StatusCell entidade="comissao" valor={r.situacaoComissao} />,
      },
    ];
    if (!mostrarValores) return base;
    return [
      ...base,
      { id: "venda", titulo: "Venda", alinhar: "right", render: (r) => <MoneyCell value={r.venda} /> },
      { id: "esperado", titulo: "Esperado", alinhar: "right", render: (r) => <MoneyCell value={r.esperado} /> },
      {
        id: "recebido",
        titulo: "Recebido",
        alinhar: "right",
        render: (r) => <MoneyCell value={r.recebido} emphasis="result" />,
      },
    ];
  }, [mostrarValores]);

  if (reservasQ.isError) return <Alert tone="danger">{mensagemDeErro(reservasQ.error)}</Alert>;

  return (
    <DataTable
      legenda="Reservas do fornecedor"
      colunas={colunas}
      linhas={itens}
      chave={(r) => r.reservaId}
      carregando={reservasQ.isLoading}
      onLinha={(r) => {
        void nav(`/viagens/${r.viagemId}?reserva=${r.reservaId}`);
      }}
      rotuloLinha={(r) => `${r.codigo} · ${r.destino}`}
      vazio={
        <EmptyState
          title="Nenhuma reserva com este fornecedor"
          description="As reservas lançadas para este fornecedor aparecem aqui."
        />
      }
      rodape={
        <Paginacao
          pagina={pagina}
          tamanho={reservasQ.data?.tamanho ?? 25}
          total={reservasQ.data?.total ?? 0}
          onPagina={setPagina}
        />
      }
    />
  );
}
