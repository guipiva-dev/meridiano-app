import { Route } from "react-router";
import { EmConstrucao } from "@/shell/EmConstrucao";

export function RotasFechamento() {
  return <Route path="/financeiro/fechamento" element={<EmConstrucao titulo="Fechamento" />} />;
}
