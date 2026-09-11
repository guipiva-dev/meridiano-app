import type { FiltroAuditoria, OqueAuditoria, ResponsavelDto } from "@/api/auditoria";
import { DateInput } from "@/components";
import { Chip } from "@/components/display";
import s from "./Auditoria.module.css";

const OQUE_OPCOES: { value: OqueAuditoria; label: string }[] = [
  { value: "tudo", label: "O quê: tudo" },
  { value: "valores", label: "Valores de reserva" },
  { value: "recebimentos", label: "Recebimentos" },
  { value: "cancelamentos", label: "Cancelamentos" },
  { value: "acesso_documento", label: "Acesso a documento" },
];

interface FiltrosAuditoriaProps {
  usuarios: ResponsavelDto[];
  usuarioId: string | undefined;
  oque: FiltroAuditoria["oque"];
  de: string | undefined;
  ate: string | undefined;
  onUsuarioId: (id: string | undefined) => void;
  onOque: (o: FiltroAuditoria["oque"]) => void;
  onDe: (d: string | undefined) => void;
  onAte: (a: string | undefined) => void;
}

export function FiltrosAuditoria({
  usuarios,
  usuarioId,
  oque,
  de,
  ate,
  onUsuarioId,
  onOque,
  onDe,
  onAte,
}: FiltrosAuditoriaProps) {
  return (
    <div className={s.filtros}>
      <div className={s.chips} role="group" aria-label="Quem">
        <Chip
          selected={usuarioId === undefined}
          onClick={() => {
            onUsuarioId(undefined);
          }}
        >
          Quem: todos
        </Chip>
        {usuarios.map((u) => (
          <Chip
            key={u.id}
            selected={usuarioId === u.id}
            onClick={() => {
              onUsuarioId(u.id);
            }}
          >
            {u.nome}
          </Chip>
        ))}
      </div>
      <div className={s.chips} role="group" aria-label="O quê">
        {OQUE_OPCOES.map((o) => (
          <Chip
            key={o.value}
            selected={(oque ?? "tudo") === o.value}
            onClick={() => {
              onOque(o.value === "tudo" ? undefined : o.value);
            }}
          >
            {o.label}
          </Chip>
        ))}
      </div>
      <DateInput
        aria-label="De"
        value={de ?? ""}
        onChange={(e) => {
          onDe(e.target.value || undefined);
        }}
      />
      <DateInput
        aria-label="Até"
        value={ate ?? ""}
        onChange={(e) => {
          onAte(e.target.value || undefined);
        }}
      />
    </div>
  );
}
