import { Route } from "react-router";
import { DespesasPage } from "./DespesasPage";

export function RotasDespesas() {
  return <Route path="/financeiro/despesas" element={<DespesasPage />} />;
}
