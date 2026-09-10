import { RotasClientes } from "@/pages/clientes/rotas";
import { RotasFornecedores } from "@/pages/fornecedores/rotas";
import { RotasGrupos } from "@/pages/grupos/rotas";

export function RotasCadastros() {
  return (
    <>
      {RotasClientes()}
      {RotasGrupos()}
      {RotasFornecedores()}
    </>
  );
}
