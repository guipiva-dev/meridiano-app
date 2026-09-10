import { Route } from "react-router";
import { EmConstrucao } from "@/shell/EmConstrucao";
import { RotaProtegida } from "@/shell/RotaProtegida";

export function RotasClientes() {
  return (
    <Route element={<RotaProtegida permissao={["cliente.ver", "cliente.ver_proprios"]} />}>
      <Route path="/clientes" element={<EmConstrucao titulo="Clientes" />} />
      <Route path="/clientes/nova" element={<EmConstrucao titulo="Novo cliente" />} />
      {/* A busca global já linka para /clientes/:id; sem esta rota o resultado cai no 404. */}
      <Route path="/clientes/:id" element={<EmConstrucao titulo="Cliente" />} />
    </Route>
  );
}
