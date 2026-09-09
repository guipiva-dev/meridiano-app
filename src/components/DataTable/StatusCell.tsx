import { StatusBadge } from "@/components/Badge/StatusBadge";
import type { EntidadeStatus } from "@/dominio/status";

export function StatusCell({ entidade, valor }: { entidade: EntidadeStatus; valor: string }) {
  return <StatusBadge entidade={entidade} valor={valor} />;
}
