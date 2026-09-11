import type { CSSProperties } from "react";
import type { ServicoVendidoDto } from "@/api/relatorios";
import { Section } from "@/components/shell";
import { cx } from "@/lib/cx";
import s from "./Relatorios.module.css";

const ROTULOS_SERVICO: Record<string, string> = {
  aereo: "Aéreo",
  hospedagem: "Hospedagem",
  seguro: "Seguro",
  traslado: "Traslado",
  passeio: "Passeio",
  ingresso: "Ingresso",
  aluguel_carro: "Aluguel de carro",
  documentacao: "Documentação",
  outro: "Outro",
};

/** Reservas que incluem cada serviço; uma reserva com N tipos conta em N barras (não é o total de reservas). */
export function ServicosVendidos({ servicos }: { servicos: ServicoVendidoDto[] }) {
  const max = Math.max(0, ...servicos.map((sv) => sv.reservas));

  return (
    <div className={s.bloco}>
      <Section
        title="Serviços vendidos"
        description="reservas que incluem cada serviço (uma reserva pode contar em mais de um)"
      >
        <div className={s.servicos}>
          {servicos.map((sv) => {
            const largura = max > 0 ? (sv.reservas / max) * 100 : 0;
            return (
              <div key={sv.tipo} className={s.horizontal}>
                <div className={s.horizontalCabecalho}>
                  <b>{ROTULOS_SERVICO[sv.tipo] ?? sv.tipo}</b>
                  <span className={s.horizontalValor}>{sv.reservas}</span>
                </div>
                <div className={s.trilha}>
                  <span className={cx(s.preenchimento, s.servico)} style={{ "--largura": largura } as CSSProperties} />
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
