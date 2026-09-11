import { Route } from "react-router";
import { AuditoriaPage } from "./AuditoriaPage";

export function RotasAuditoriaPagina() {
  return <Route path="/auditoria" element={<AuditoriaPage />} />;
}
