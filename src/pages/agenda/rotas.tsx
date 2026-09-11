import { Route } from "react-router";
import { AgendaPage } from "./AgendaPage";

export function RotasAgendaPagina() {
  return <Route path="/agenda" element={<AgendaPage />} />;
}
