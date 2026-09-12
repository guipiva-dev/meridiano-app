import { render, screen } from "@testing-library/react";
import type { ViagemDto } from "@/api/viagens";
import { TransferirModal } from "./TransferirModal";

function viagem(): ViagemDto {
  return {
    id: "v1",
    codigo: "VG-2026-0001",
    versao: "5",
    destino: "Lisboa",
    tipo: "internacional",
    dataIda: "2026-05-01",
    dataVolta: "2026-05-10",
    vendedorId: "u1",
    vendedorNome: "Ana",
    agenteId: "u1",
    agenteNome: "Ana",
    ocasiao: null,
    observacoes: null,
    cancelada: false,
    canceladaEm: null,
    motivoCancelamento: null,
    faseOperacional: "em_emissao",
    faseFinanceira: "a_receber",
    passageiros: [{ clienteId: "c1", nome: "Carlos Mendes", titular: true }],
    reservas: [],
  };
}

test("só oferece vendedores com perfil dono ou agente, sem o agente atual", () => {
  const vendedores = [
    { id: "u1", nome: "Ana", perfil: "agente", geraRepasse: false, percentualPadrao: 0 },
    { id: "u2", nome: "Bia", perfil: "dono", geraRepasse: false, percentualPadrao: 0 },
    { id: "u3", nome: "Carlos", perfil: "agente", geraRepasse: false, percentualPadrao: 0 },
    { id: "u4", nome: "Duda", perfil: "vendedor_externo", geraRepasse: false, percentualPadrao: 0 },
    { id: "u5", nome: "Eva", perfil: "financeiro", geraRepasse: false, percentualPadrao: 0 },
  ];
  render(<TransferirModal open viagem={viagem()} vendedores={vendedores} onClose={vi.fn()} onTransferida={vi.fn()} />);

  const select = screen.getByLabelText(/Novo agente/);
  const rotulos = Array.from(select.querySelectorAll("option")).map((o) => o.textContent);

  expect(rotulos).toEqual(["Selecionar", "Bia", "Carlos"]);
});
