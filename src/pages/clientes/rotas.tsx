import { Route } from "react-router";
import { RotaProtegida } from "@/shell/RotaProtegida";
import { ClientesPage } from "./ClientesPage";
import { PessoaPage } from "./PessoaPage";

export function RotasClientes() {
  return (
    <Route element={<RotaProtegida permissao={["cliente.ver", "cliente.ver_proprios"]} />}>
      <Route path="/clientes" element={<ClientesPage />} />
      <Route path="/clientes/nova" element={<PessoaPage />} />
      {/* A busca global já linka para /clientes/:id. */}
      <Route path="/clientes/:id" element={<PessoaPage />} />
    </Route>
  );
}
