import { Route } from "react-router";
import { EmConstrucao } from "@/shell/EmConstrucao";

export function RotasAuditoriaPagina() {
  return <Route path="/auditoria" element={<EmConstrucao titulo="Auditoria" />} />;
}
