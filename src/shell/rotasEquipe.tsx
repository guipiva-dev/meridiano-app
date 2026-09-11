import { Route } from "react-router";
import { RotasEquipePagina } from "@/pages/equipe/rotas";
import { RotaProtegida } from "./RotaProtegida";

export function RotasEquipe() {
  return <Route element={<RotaProtegida permissao="usuario.gerenciar" />}>{RotasEquipePagina()}</Route>;
}
