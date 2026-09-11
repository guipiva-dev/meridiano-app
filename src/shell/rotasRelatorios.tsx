import { Route } from "react-router";
import { RotasRelatoriosPagina } from "@/pages/relatorios/rotas";
import { RotaProtegida } from "./RotaProtegida";

export function RotasRelatorios() {
  return <Route element={<RotaProtegida permissao="relatorio.ver" />}>{RotasRelatoriosPagina()}</Route>;
}
