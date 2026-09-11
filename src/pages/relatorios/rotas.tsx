import { Route } from "react-router";
import { RelatoriosPage } from "./RelatoriosPage";

export function RotasRelatoriosPagina() {
  return <Route path="/relatorios" element={<RelatoriosPage />} />;
}
