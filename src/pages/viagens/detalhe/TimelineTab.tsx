import { useQuery } from "@tanstack/react-query";
import { auditoriaApi, chavesAuditoria, type EventoAuditoriaDto } from "@/api/auditoria";
import { mensagemDeErro } from "@/api/errors";
import { Alert } from "@/components/display";
import { EmptyState, Skeleton } from "@/components/feedback";
import { cx } from "@/lib/cx";
import { formatarCarimbo } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";
import s from "./Viagem.module.css";

const DINHEIRO = /^(valor_|rav_|taxa_|multa_)/;

/** Dinheiro formatado nos campos de valor; o resto vira texto (JSON para objeto/array). */
function valorDoCampo(campo: string, valor: unknown): string {
  if (valor === null || valor === undefined) return "—";
  if (DINHEIRO.test(campo) && typeof valor === "number") return formatarDinheiro(valor);
  return typeof valor === "string" ? valor : JSON.stringify(valor);
}

function bolinhaDe(e: EventoAuditoriaDto): string | undefined {
  if (e.tabela === "movimento_financeiro" || e.tabela === "repasse") return s.money;
  return /cancelad|excluíd|removid|substituíd/i.test(e.titulo) ? s.warn : s.normal;
}

export function TimelineTab({ viagemId }: { viagemId: string }) {
  const q = useQuery({ queryKey: chavesAuditoria.daViagem(viagemId), queryFn: () => auditoriaApi.daViagem(viagemId) });

  if (q.isPending) return <Skeleton lines={4} />;
  if (q.isError) return <Alert tone="danger">{mensagemDeErro(q.error)}</Alert>;
  if (q.data.length === 0) {
    return (
      <EmptyState title="Sem eventos" description="As alterações desta viagem aparecem aqui conforme acontecem." />
    );
  }

  return (
    <ol className={s.timeline}>
      {q.data.map((e) => {
        const campos = Object.entries(e.alteracoes);
        return (
          <li key={e.id} className={s.evento}>
            <span className={cx(s.bolinha, bolinhaDe(e))} aria-hidden />
            <div className={s.linhaTexto}>
              <b className={s.linhaTitulo}>{e.titulo}</b>
              {e.subtitulo && <span className={s.linhaMeta}>{e.subtitulo}</span>}
              <span className={s.linhaMeta}>
                {formatarCarimbo(e.criadoEm)} · {e.usuarioNome ?? "sistema"}
              </span>
              {e.motivo && <span className={s.linhaMeta}>Motivo: {e.motivo}</span>}
              {campos.length > 0 && (
                <details className={s.detalhes}>
                  <summary>Ver detalhes</summary>
                  <table className={s.tabela}>
                    <thead>
                      <tr>
                        <th scope="col">Campo</th>
                        <th scope="col">De</th>
                        <th scope="col">Para</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campos.map(([campo, a]) => (
                        <tr key={campo}>
                          <th scope="row">{campo}</th>
                          <td>{valorDoCampo(campo, a.de)}</td>
                          <td>{valorDoCampo(campo, a.para)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
