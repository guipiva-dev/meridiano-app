import { Route } from "react-router";
import { RotasAgendaPagina } from "@/pages/agenda/rotas";
import { RotaProtegida } from "./RotaProtegida";

// R16: a agenda lista pendências de viagens — exige ver viagens (todas ou as próprias).
export function RotasAgenda() {
  return (
    <Route element={<RotaProtegida permissao={["viagem.ver", "viagem.ver_proprias"]} />}>{RotasAgendaPagina()}</Route>
  );
}
