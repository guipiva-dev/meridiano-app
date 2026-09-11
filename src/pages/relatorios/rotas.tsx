import { Route } from "react-router";
import { EmConstrucao } from "@/shell/EmConstrucao";

export function RotasRelatoriosPagina() {
  return <Route path="/relatorios" element={<EmConstrucao titulo="Relatórios" />} />;
}
