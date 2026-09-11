import { Link } from "react-router";
import type { EmbarqueDto, RetornoDto } from "@/api/agenda";
import { StatusCell } from "@/components";
import { Section } from "@/components/shell";
import { formatarData } from "@/lib/datas";
import s from "./Agenda.module.css";

function diaCurto(iso: string): string {
  const data = new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
  const semana = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(data).replace(".", "");
  return `${semana} ${formatarData(iso)}`;
}

export function EmbarquesTab({ embarques, retornos }: { embarques: EmbarqueDto[]; retornos: RetornoDto[] }) {
  return (
    <div className={s.embarquesGrid}>
      <Section title="Embarques" description="próximos 14 dias">
        {embarques.length === 0 ? (
          <p className={s.vazio}>Nenhum embarque nos próximos 14 dias.</p>
        ) : (
          <div className={s.lista}>
            {embarques.map((e) => (
              <div key={e.viagemId} className={s.linha}>
                <div className={s.texto}>
                  <b className={s.titulo}>{e.titular ?? e.codigo}</b>
                  <span className={s.meta}>
                    {e.destino} · {diaCurto(e.dataIda)} · {e.numPax} pax
                  </span>
                </div>
                <StatusCell entidade="fase_viagem" valor={e.faseOperacional} />
                <Link to={`/viagens/${e.viagemId}`} className={s.abrir}>
                  Abrir
                </Link>
              </div>
            ))}
          </div>
        )}
      </Section>
      <Section title="Retornos">
        {retornos.length === 0 ? (
          <p className={s.vazio}>Nenhum retorno nos próximos 14 dias.</p>
        ) : (
          <div className={s.lista}>
            {retornos.map((r) => (
              <div key={r.viagemId} className={s.linha}>
                <div className={s.texto}>
                  <b className={s.titulo}>{r.titular ?? r.codigo}</b>
                  <span className={s.meta}>
                    {r.destino} · {diaCurto(r.dataVolta)}
                  </span>
                </div>
                {r.posViagemEm && <span className={s.meta}>pós-viagem em {formatarData(r.posViagemEm)}</span>}
                <Link to={`/viagens/${r.viagemId}`} className={s.abrir}>
                  Abrir
                </Link>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
