import { Route } from "react-router";
import { RotasConciliacao } from "@/pages/financeiro/conciliacao/rotas";
import { RotasDespesas } from "@/pages/financeiro/despesas/rotas";
import { RotasFechamento } from "@/pages/financeiro/fechamento/rotas";
import { RotasRepasses } from "@/pages/financeiro/repasses/rotas";
import { RotaProtegida } from "./RotaProtegida";

// C7: o Contador só tem `financeiro.ver_dre` — entra no módulo em leitura; os botões de escrita é que checam as outras.
export function RotasFinanceiro() {
  return (
    <Route
      element={<RotaProtegida permissao={["financeiro.movimentar", "financeiro.conciliar", "financeiro.ver_dre"]} />}
    >
      {RotasConciliacao()}
      {RotasRepasses()}
      {RotasDespesas()}
      {RotasFechamento()}
    </Route>
  );
}
