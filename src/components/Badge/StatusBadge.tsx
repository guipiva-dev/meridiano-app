import { apresentacaoStatus, type EntidadeStatus } from "@/dominio/status";
import { Badge } from "./Badge";

export function StatusBadge({ entidade, valor }: { entidade: EntidadeStatus; valor: string }) {
  const a = apresentacaoStatus(entidade, valor);
  return <Badge tone={a.tone}>{a.texto}</Badge>;
}
