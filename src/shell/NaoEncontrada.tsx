import { Compass } from "lucide-react";
import { Link } from "react-router";
import { EmptyState } from "@/components/feedback";
import { Page, PageHeader } from "@/components/shell";

export function NaoEncontrada() {
  return (
    <Page>
      <PageHeader title="Página não encontrada" />
      <EmptyState
        icon={<Compass size={32} />}
        title="Este endereço não existe"
        description="Confira o endereço ou volte para Viagens."
        action={<Link to="/viagens">Ir para Viagens</Link>}
      />
    </Page>
  );
}
