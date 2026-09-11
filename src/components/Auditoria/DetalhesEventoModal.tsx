import type { EventoAuditoriaDto } from "@/api/auditoria";
import { Modal } from "@/components/feedback";
import s from "./Auditoria.module.css";
import { valorDoCampo } from "./valorDoCampo";

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
              <td>{valorDoCampo(campo, alteracao.de)}</td>
              <td>{valorDoCampo(campo, alteracao.para)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}
