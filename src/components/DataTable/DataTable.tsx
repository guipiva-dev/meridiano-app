import { ChevronDown, ChevronUp } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { Skeleton } from "@/components/Skeleton/Skeleton";
import { cx } from "@/lib/cx";
import s from "./DataTable.module.css";

export interface Coluna<T> {
  id: string;
  titulo: string;
  alinhar?: "right";
  ordenavel?: boolean;
  render: (linha: T) => ReactNode;
  largura?: string;
}

export interface Ordenacao {
  campo: string;
  direcao: "asc" | "desc";
}

interface DataTableProps<T> {
  colunas: Coluna<T>[];
  linhas: T[];
  chave: (l: T) => string;
  onLinha?: (l: T) => void;
  rotuloLinha?: (l: T) => string;
  carregando?: boolean;
  vazio?: ReactNode;
  ordenacao?: Ordenacao;
  onOrdenar?: (o: Ordenacao) => void;
  rodape?: ReactNode;
  legenda: string;
}

export function DataTable<T>({
  colunas,
  linhas,
  chave,
  onLinha,
  rotuloLinha,
  carregando = false,
  vazio,
  ordenacao,
  onOrdenar,
  rodape,
  legenda,
}: DataTableProps<T>) {
  function ordenarPor(id: string) {
    const proxima: "asc" | "desc" = ordenacao?.campo === id && ordenacao.direcao === "asc" ? "desc" : "asc";
    onOrdenar?.({ campo: id, direcao: proxima });
  }
  function teclaLinha(e: KeyboardEvent<HTMLTableRowElement>, l: T) {
    if (e.key === "Enter") onLinha?.(l);
    else if (e.key === " ") {
      e.preventDefault(); // não rola a página
      onLinha?.(l);
    }
  }

  return (
    <div className={s.wrap}>
      <table className={s.table}>
        <caption className={s.visuallyHidden}>{legenda}</caption>
        <thead>
          <tr>
            {colunas.map((c) => {
              const ativa = ordenacao?.campo === c.id;
              const ariaSort = c.ordenavel
                ? ativa
                  ? ordenacao.direcao === "asc"
                    ? "ascending"
                    : "descending"
                  : "none"
                : undefined;
              return (
                <th
                  key={c.id}
                  style={{ width: c.largura }}
                  className={cx(c.alinhar === "right" && s.right)}
                  aria-sort={ariaSort}
                >
                  {c.ordenavel ? (
                    <button
                      type="button"
                      className={s.sortBtn}
                      onClick={() => {
                        ordenarPor(c.id);
                      }}
                    >
                      {c.titulo}
                      {ativa &&
                        (ordenacao.direcao === "asc" ? (
                          <ChevronUp size={16} aria-hidden />
                        ) : (
                          <ChevronDown size={16} aria-hidden />
                        ))}
                    </button>
                  ) : (
                    c.titulo
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {carregando ? (
            <tr>
              <td colSpan={colunas.length}>
                <Skeleton.Block height="table" />
              </td>
            </tr>
          ) : linhas.length === 0 ? (
            <tr>
              <td colSpan={colunas.length} className={s.vazio}>
                {vazio}
              </td>
            </tr>
          ) : (
            linhas.map((l) => (
              <tr
                key={chave(l)}
                tabIndex={onLinha ? 0 : undefined}
                className={cx(onLinha && s.clicavel)}
                aria-label={rotuloLinha?.(l)}
                onClick={
                  onLinha
                    ? () => {
                        onLinha(l);
                      }
                    : undefined
                }
                onKeyDown={
                  onLinha
                    ? (e) => {
                        teclaLinha(e, l);
                      }
                    : undefined
                }
              >
                {colunas.map((c) => (
                  <td key={c.id} className={cx(c.alinhar === "right" && s.right)}>
                    {c.render(l)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {rodape && <div className={s.rodape}>{rodape}</div>}
    </div>
  );
}
