import { Route } from "react-router";
import { EmConstrucao } from "@/shell/EmConstrucao";

export function RotasConciliacao() {
  return <Route path="/financeiro" element={<EmConstrucao titulo="Conciliação" />} />;
}
