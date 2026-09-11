import { Route } from "react-router";
import { RotasAuditoriaPagina } from "@/pages/auditoria/rotas";
import { RotaProtegida } from "./RotaProtegida";

export function RotasAuditoria() {
  return <Route element={<RotaProtegida permissao="auditoria.ver" />}>{RotasAuditoriaPagina()}</Route>;
}
