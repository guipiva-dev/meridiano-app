import { Navigate, Route } from "react-router";
import { ViagemPage } from "@/pages/viagens/detalhe/ViagemPage";
import { ViagensPage } from "@/pages/viagens/lista/ViagensPage";
import { NovaViagemPage } from "@/pages/viagens/NovaViagemPage";
import { AppShell } from "./AppShell";
import { EmConstrucao } from "./EmConstrucao";
import { RotaProtegida } from "./RotaProtegida";
import { RotasCadastros } from "./rotasCadastros";
import { RotasFinanceiro } from "./rotasFinanceiro";

export function RotasApp() {
  return (
    <Route element={<AppShell />}>
      <Route index element={<Navigate to="/viagens" replace />} />
      <Route element={<RotaProtegida permissao={["viagem.ver", "viagem.ver_proprias"]} />}>
        <Route path="/viagens" element={<ViagensPage />} />
        <Route path="/viagens/nova" element={<NovaViagemPage />} />
        <Route path="/viagens/:id" element={<ViagemPage />} />
        <Route path="/viagens/:id/editar" element={<NovaViagemPage />} />
      </Route>
      {RotasCadastros()}
      {RotasFinanceiro()}
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
