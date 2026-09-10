import { Route } from "react-router";
import { FechamentoPage } from "./FechamentoPage";

export function RotasFechamento() {
  return <Route path="/financeiro/fechamento" element={<FechamentoPage />} />;
}
