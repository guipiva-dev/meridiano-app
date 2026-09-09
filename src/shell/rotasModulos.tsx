import { Navigate, Route } from "react-router";
import { ViagensPage } from "@/pages/viagens/lista/ViagensPage";
import { NovaViagemPage } from "@/pages/viagens/NovaViagemPage";
import { AppShell } from "./AppShell";
import { EmConstrucao } from "./EmConstrucao";
import { RotaProtegida } from "./RotaProtegida";

export function RotasApp() {
  return (
    <Route element={<AppShell />}>
      <Route index element={<Navigate to="/viagens" replace />} />
      <Route element={<RotaProtegida permissao={["viagem.ver", "viagem.ver_proprias"]} />}>
        <Route path="/viagens" element={<ViagensPage />} />
        <Route path="/viagens/nova" element={<NovaViagemPage />} />
        <Route path="/viagens/:id" element={<EmConstrucao titulo="Viagem" />} />
        <Route path="/viagens/:id/editar" element={<NovaViagemPage />} />
      </Route>
      <Route path="/clientes" element={<EmConstrucao titulo="Clientes" />} />
      <Route path="/clientes/grupos" element={<EmConstrucao titulo="Grupos" />} />
      <Route path="/fornecedores" element={<EmConstrucao titulo="Fornecedores" />} />
      <Route element={<RotaProtegida permissao={["financeiro.movimentar", "financeiro.conciliar"]} />}>
        <Route path="/financeiro" element={<EmConstrucao titulo="Conciliação" />} />
        <Route path="/financeiro/repasses" element={<EmConstrucao titulo="Repasses" />} />
        <Route path="/financeiro/despesas" element={<EmConstrucao titulo="Despesas" />} />
        <Route path="/financeiro/fechamento" element={<EmConstrucao titulo="Fechamento" />} />
      </Route>
      <Route path="/agenda" element={<EmConstrucao titulo="Agenda" />} />
      <Route element={<RotaProtegida permissao="relatorio.ver" />}>
        <Route path="/relatorios" element={<EmConstrucao titulo="Relatórios" />} />
      </Route>
      <Route element={<RotaProtegida permissao="usuario.gerenciar" />}>
        <Route path="/equipe" element={<EmConstrucao titulo="Equipe" />} />
      </Route>
      <Route element={<RotaProtegida permissao="auditoria.ver" />}>
        <Route path="/auditoria" element={<EmConstrucao titulo="Auditoria" />} />
      </Route>
      <Route
        path="*"
        element={
          <EmConstrucao
            titulo="Página não encontrada"
            descricao="Endereço não existe. Confira o link ou volte para Viagens."
          />
        }
      />
    </Route>
  );
}
