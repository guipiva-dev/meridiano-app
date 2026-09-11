import { Route } from "react-router";
import { EmConstrucao } from "@/shell/EmConstrucao";

export function RotasAgendaPagina() {
  return <Route path="/agenda" element={<EmConstrucao titulo="Agenda" />} />;
}
