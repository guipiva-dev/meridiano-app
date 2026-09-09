import { Construction } from "lucide-react";
import { useLocation } from "react-router";
import { EmptyState } from "@/components/feedback";
import { Page, PageHeader, Subnav } from "@/components/shell";
import { subnavs } from "./navegacao";

export function EmConstrucao({ titulo, descricao }: { titulo: string; descricao?: string }) {
  const { pathname } = useLocation();
  const modulo = Object.keys(subnavs).find((k) => pathname.startsWith(k));
  const itens = modulo ? subnavs[modulo] : undefined;
  return (
    <Page>
      <PageHeader title={titulo} />
      {itens && <Subnav items={itens} />}
      <EmptyState
        icon={<Construction size={32} />}
        title="Em construção"
        description={descricao ?? "Esta tela chega no próximo subplano da Fase 3."}
      />
    </Page>
  );
}
