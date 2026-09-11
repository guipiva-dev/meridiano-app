import type { EventoAuditoriaDto } from "@/api/auditoria";
import { Modal } from "@/components/feedback";
import { formatarData } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";
import s from "./Auditoria.module.css";

const CAMPOS_DINHEIRO = /^(valor_|rav_|taxa_|multa_)/;
const DATA_ISO = /^\d{4}-\d{2}-\d{2}/;

/** Mesma regra do TimelineTab (Modules/Auditoria): dinheiro nos campos conhecidos, booleano em Sim/Não, data ISO formatada. */
function valorFormatado(campo: string, valor: unknown): string {
  if (valor === null || valor === undefined) return "—";
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (typeof valor === "number" && CAMPOS_DINHEIRO.test(campo)) return formatarDinheiro(valor);
  if (typeof valor === "string" && DATA_ISO.test(valor)) return formatarData(valor);
  return typeof valor === "string" ? valor : JSON.stringify(valor);
}

export function DetalhesEventoModal({ evento, onClose }: { evento: EventoAuditoriaDto; onClose: () => void }) {
  const campos = Object.entries(evento.alteracoes);
  return (
    <Modal open title={evento.titulo} onClose={onClose}>
      <table className={s.tabela}>
        <thead>
          <tr>
            <th scope="col">Campo</th>
            <th scope="col">De</th>
            <th scope="col">Para</th>
          </tr>
        </thead>
        <tbody>
          {campos.map(([campo, alteracao]) => (
            <tr key={campo}>
              <th scope="row">{campo}</th>
              <td>{valorFormatado(campo, alteracao.de)}</td>
              <td>{valorFormatado(campo, alteracao.para)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}
