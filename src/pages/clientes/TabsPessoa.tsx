import type { ReactNode } from "react";
import { AtendimentosPessoa, DocumentosPessoa, ViagensPessoa } from "@/components/cadastros";
import { ListaPendencias } from "@/components/pendencias";
import { type Tab, Tabs } from "@/components/shell";
import type { usePessoa } from "./usePessoa";

interface TabsPessoaProps {
  clienteId: string;
  pessoa: ReturnType<typeof usePessoa>;
  podeEditar: boolean;
  verDocumento: boolean;
  formulario: ReactNode;
}

export function TabsPessoa({ clienteId, pessoa, podeEditar, verDocumento, formulario }: TabsPessoaProps) {
  const tabs: Tab[] = [
    { id: "dados", label: "Dados" },
    // Sem contador: buscar documentos aqui gravaria `log_acesso_documento` a cada abertura da pessoa.
    { id: "documentos", label: "Documentos" },
    { id: "pendencias", label: "Pendências", count: pessoa.pendenciasAbertas },
    { id: "viagens", label: "Viagens", count: pessoa.viagens.length },
    { id: "atendimentos", label: "Atendimentos", count: pessoa.atendimentos },
  ];
  const tab = tabs.some((t) => t.id === pessoa.tab) ? pessoa.tab : "dados";

  return (
    <Tabs tabs={tabs} active={tab} onChange={pessoa.setTab}>
      <Tabs.Panel id="dados" active={tab}>
        {formulario}
      </Tabs.Panel>
      <Tabs.Panel id="documentos" active={tab}>
        <DocumentosPessoa clienteId={clienteId} verDocumento={verDocumento} podeEditar={podeEditar} />
      </Tabs.Panel>
      <Tabs.Panel id="pendencias" active={tab}>
        <ListaPendencias
          clienteId={clienteId}
          viagens={pessoa.viagens}
          vendedores={pessoa.vendedores}
          podeEditar={podeEditar}
        />
      </Tabs.Panel>
      <Tabs.Panel id="viagens" active={tab}>
        <ViagensPessoa viagens={pessoa.viagens} />
      </Tabs.Panel>
      <Tabs.Panel id="atendimentos" active={tab}>
        <AtendimentosPessoa clienteId={clienteId} podeEditar={podeEditar} />
      </Tabs.Panel>
    </Tabs>
  );
}
