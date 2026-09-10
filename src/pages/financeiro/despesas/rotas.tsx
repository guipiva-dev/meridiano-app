import { Route } from "react-router";
import { EmConstrucao } from "@/shell/EmConstrucao";

export function RotasDespesas() {
  return <Route path="/financeiro/despesas" element={<EmConstrucao titulo="Despesas" />} />;
}
